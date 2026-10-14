import * as grpc from '@grpc/grpc-js';
import type { Response } from 'express';
import type { AcousticServiceClient } from '../../../packages/contracts/generated/silentradar/acoustic/v1/AcousticService.js';
import type { SnapshotEvent__Output } from '../../../packages/contracts/generated/silentradar/acoustic/v1/SnapshotEvent.js';
import type { SnapshotEvent } from '../../../packages/http-contracts/src/index.js';
import { fromWireEvent } from '../../../packages/contracts/src/mappers.js';

export class StreamBridge {
  private stream?: grpc.ClientReadableStream<SnapshotEvent__Output>;
  private retry?: ReturnType<typeof setTimeout>;
  private attempt = 0;
  private stopped = false;
  private cache?: SnapshotEvent;
  private clients = new Map<
    Response,
    { ip: string; send: (event: string, data: unknown, id?: string) => void; close: () => void }
  >();
  constructor(
    private client: AcousticServiceClient,
    private retryBaseMs = 1000,
  ) {
    this.connect();
  }
  get synchronized() {
    return !!this.cache;
  }

  private connect() {
    if (this.stopped) return;
    const stream = this.client.watchSpaces({});
    this.stream = stream;
    let ended = false;
    const reconnect = () => {
      if (ended || this.stopped || this.stream !== stream) return;
      ended = true;
      this.cache = undefined;
      stream.cancel();
      for (const client of this.clients.values())
        client.send('connection', { status: 'reconnecting' });
      const delay =
        Math.min(30_000, this.retryBaseMs * 2 ** Math.min(this.attempt++, 5)) +
        Math.random() * this.retryBaseMs * 0.2;
      this.retry = setTimeout(() => this.connect(), delay);
    };
    stream.on('data', (wire: SnapshotEvent__Output) => {
      if (ended || this.stopped || this.stream !== stream) return;
      try {
        const event = fromWireEvent(wire);
        if (!this.cache && event.reason !== 'INITIAL')
          throw new Error('Stream has no initial snapshot');
        this.cache = event;
        this.attempt = 0;
        console.log(
          JSON.stringify({
            service: 'gateway',
            rpc: 'WatchSpaces',
            reason: event.reason,
            revision: event.snapshot.revision,
          }),
        );
        for (const client of this.clients.values()) {
          client.send(
            'snapshot',
            event,
            `${event.snapshot.serviceInstanceId}:${event.snapshot.revision}`,
          );
          client.send('connection', { status: 'live' });
        }
      } catch (error) {
        console.error(
          'Contrato de stream inválido:',
          error instanceof Error ? error.message : 'error',
        );
        reconnect();
      }
    });
    stream.on('error', reconnect);
    stream.on('end', reconnect);
  }

  attach(response: Response, ip: string): boolean {
    if (
      this.clients.size >= 100 ||
      [...this.clients.values()].filter((client) => client.ip === ip).length >= 5
    )
      return false;
    response
      .status(200)
      .set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      });
    response.flushHeaders();
    response.write('retry: 3000\n\n');
    let blocked = false;
    let pending: string | undefined;
    let slow: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    let heartbeat: ReturnType<typeof setInterval>;
    let rotation: ReturnType<typeof setTimeout>;
    const close = () => {
      if (closed) return;
      closed = true;
      this.clients.delete(response);
      clearInterval(heartbeat);
      clearTimeout(rotation);
      clearTimeout(slow);
      response.off('drain', drain);
      pending = undefined;
      response.end();
    };
    const write = (frame: string) => {
      if (closed) return;
      if (blocked) {
        pending = frame;
        return;
      }
      blocked = !response.write(frame);
      if (blocked) slow = setTimeout(close, 30_000);
    };
    // Agrupar estado y conexión en un frame evita perder el snapshot al aplicar backpressure.
    const send = (event: string, data: unknown, id?: string) => {
      const frame = `${id ? `id: ${id}\n` : ''}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      if (blocked && event === 'connection' && pending) {
        pending += frame;
        return;
      }
      write(frame);
    };
    const drain = () => {
      blocked = false;
      clearTimeout(slow);
      const next = pending;
      pending = undefined;
      if (next) write(next);
    };
    this.clients.set(response, { ip, send, close });
    response.on('drain', drain);
    response.on('close', close);
    response.on('error', close);
    heartbeat = setInterval(() => {
      if (!blocked && !closed) write(': heartbeat\n\n');
    }, 15_000);
    rotation = setTimeout(close, 50 * 60_000);
    send('connection', { status: this.cache ? 'live' : 'syncing' });
    if (this.cache)
      send(
        'snapshot',
        { ...this.cache, reason: 'INITIAL' },
        `${this.cache.snapshot.serviceInstanceId}:${this.cache.snapshot.revision}`,
      );
    return true;
  }
  close() {
    this.stopped = true;
    clearTimeout(this.retry);
    this.stream?.cancel();
    for (const client of [...this.clients.values()]) client.close();
    this.cache = undefined;
  }
}
