import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import * as grpc from '@grpc/grpc-js';
import { createAcousticServer, bindServer } from '../apps/acoustic/src/server.js';
import { AcousticStore } from '../apps/acoustic/src/domain/store.js';
import { createGateway, unary } from '../apps/gateway/src/app.js';
import { AcousticService } from '../packages/contracts/src/rpc.js';
import { eventSchema, type SnapshotEvent } from '../packages/http-contracts/src/index.js';

async function openSse(url: string) {
  const controller = new AbortController();
  const response = await fetch(url, { signal: controller.signal });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  return {
    close: () => {
      controller.abort();
      void reader.cancel().catch(() => {});
    },
    async next(predicate: (event: SnapshotEvent) => boolean = () => true): Promise<SnapshotEvent> {
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        while (true) {
          const boundary = buffer.indexOf('\n\n');
          if (boundary >= 0) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (frame.includes('event: snapshot')) {
              const line = frame.split('\n').find((line) => line.startsWith('data: '))!;
              const event = eventSchema.parse(JSON.parse(line.slice(6)));
              if (predicate(event)) return event;
            }
            continue;
          }
          const chunk = await reader.read();
          if (chunk.done) throw new Error('SSE closed unexpectedly');
          buffer += decoder.decode(chunk.value, { stream: true });
        }
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
describe('Real gRPC → HTTP → SSE integration', () => {
  let acoustic: ReturnType<typeof createAcousticServer>;
  let gateway: ReturnType<typeof createGateway>;
  let http: Server;
  let port: number;
  let url: string;
  let now: number;
  const streams: Awaited<ReturnType<typeof openSse>>[] = [];
  beforeEach(async () => {
    now = Date.now();
    acoustic = createAcousticServer(new AcousticStore(() => now), 60_000);
    port = await bindServer(acoustic.server, '127.0.0.1:0');
    gateway = createGateway({ target: `127.0.0.1:${port}`, retryBaseMs: 50, rateMax: 100 });
    http = gateway.app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => http.once('listening', resolve));
    const address = http.address();
    if (!address || typeof address === 'string') throw new Error('No HTTP port');
    url = `http://127.0.0.1:${address.port}`;
  });
  afterEach(async () => {
    for (const stream of streams.splice(0)) stream.close();
    gateway.close();
    acoustic.stopTimer();
    acoustic.server.forceShutdown();
    http.closeAllConnections();
    await new Promise<void>((resolve) => http.close(() => resolve()));
  });
  it('updates two browsers from an actual unary RPC and server stream, then expires without POST', async () => {
    const a = await openSse(`${url}/api/v1/events`);
    const b = await openSse(`${url}/api/v1/events`);
    streams.push(a, b);
    expect((await a.next()).snapshot.spaces).toHaveLength(4);
    await b.next();
    const input = { requestId: randomUUID(), spaceId: 'biblioteca-central', level: 5 };
    const result = await request(gateway.app).post('/api/v1/reports').send(input);
    expect(result.status).toBe(201);
    const [ea, eb] = await Promise.all([
      a.next((event) => event.reason === 'REPORT_ACCEPTED'),
      b.next((event) => event.reason === 'REPORT_ACCEPTED'),
    ]);
    expect(ea.snapshot).toEqual(eb.snapshot);
    expect(ea.snapshot.spaces[0]).toMatchObject({
      status: 'LOUD',
      averageNoise: 5,
      recentReportCount: 1,
    });
    const duplicate = await request(gateway.app).post('/api/v1/reports').send(input);
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.duplicate).toBe(true);
    now += 30 * 60_000;
    acoustic.store.sweep();
    const expired = await a.next((event) => event.reason === 'REPORTS_EXPIRED');
    expect(expired.snapshot.spaces[0].status).toBe('NO_DATA');
    expect((await request(gateway.app).get('/health/ready')).status).toBe(200);
  });
  it('recovers after restarting the gRPC process and replaces its instance identity', async () => {
    const stream = await openSse(`${url}/api/v1/events`);
    streams.push(stream);
    const initial = await stream.next();
    acoustic.stopTimer();
    acoustic.server.forceShutdown();
    acoustic = createAcousticServer();
    await bindServer(acoustic.server, `127.0.0.1:${port}`);
    const reset = await stream.next(
      (event) =>
        event.reason === 'INITIAL' &&
        event.snapshot.serviceInstanceId !== initial.snapshot.serviceInstanceId,
    );
    expect(reset.snapshot.revision).toBe('0');
    expect(reset.snapshot.spaces.every((space) => space.status === 'NO_DATA')).toBe(true);
  });
  it('returns structured validation, not found and idempotency errors', async () => {
    const input = { requestId: randomUUID(), spaceId: 'cafeteria', level: 2 };
    for (const level of [0, 6, 2.5, '2', null])
      expect(
        (
          await request(gateway.app)
            .post('/api/v1/reports')
            .send({ ...input, level })
        ).status,
      ).toBe(400);
    expect(
      (
        await request(gateway.app)
          .post('/api/v1/reports')
          .send({ ...input, unwanted: true })
      ).status,
    ).toBe(400);
    expect((await request(gateway.app).get('/api/v1/spaces/no-existe')).status).toBe(404);
    expect((await request(gateway.app).post('/api/v1/reports').send(input)).status).toBe(201);
    const conflict = await request(gateway.app)
      .post('/api/v1/reports')
      .send({ ...input, level: 5 });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
    const snapshot = await request(gateway.app).get('/api/v1/spaces');
    expect(
      snapshot.body.spaces.find((space: { id: string }) => space.id === 'cafeteria')
        .recentReportCount,
    ).toBe(1);
  });
  it('rejects invalid direct RPCs, JSON syntax, media types, size and CORS', async () => {
    const client = new AcousticService(`127.0.0.1:${port}`, grpc.credentials.createInsecure());
    try {
      await expect(
        unary((callback) =>
          client.submitReport(
            { requestId: randomUUID(), spaceId: 'cafeteria', level: 0 },
            callback,
          ),
        ),
      ).rejects.toMatchObject({ code: grpc.status.INVALID_ARGUMENT });
    } finally {
      client.close();
    }
    expect(
      (
        await request(gateway.app)
          .post('/api/v1/reports')
          .set('Content-Type', 'application/json')
          .send('{invalid')
      ).status,
    ).toBe(400);
    expect(
      (
        await request(gateway.app)
          .post('/api/v1/reports')
          .set('Content-Type', 'text/plain')
          .send('hello')
      ).status,
    ).toBe(415);
    expect(
      (
        await request(gateway.app)
          .post('/api/v1/reports')
          .send({ large: 'x'.repeat(3000) })
      ).status,
    ).toBe(413);
    expect(
      (
        await request(gateway.app)
          .post('/api/v1/reports')
          .set('Origin', 'https://evil.example')
          .send({})
      ).status,
    ).toBe(403);
  });
  it('reports upstream failure and bounds HTTP report attempts', async () => {
    acoustic.stopTimer();
    acoustic.server.forceShutdown();
    expect((await request(gateway.app).get('/api/v1/spaces')).status).toBe(503);
    gateway.close();
    gateway = createGateway({ target: `127.0.0.1:${port}`, rateMax: 1 });
    await request(gateway.app).post('/api/v1/reports').send({});
    const limited = await request(gateway.app).post('/api/v1/reports').send({});
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
  });
});
