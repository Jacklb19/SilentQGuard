import * as grpc from '@grpc/grpc-js';
import { AcousticService } from '../../../packages/contracts/src/rpc.js';
import {
  toTimestamp,
  toWireSnapshot,
  toWireReport,
  toWireSpace,
  toWireEvent,
} from '../../../packages/contracts/src/mappers.js';
import type { AcousticServiceHandlers } from '../../../packages/contracts/generated/silentradar/acoustic/v1/AcousticService.js';
import type { SnapshotEvent } from '../../../packages/http-contracts/src/index.js';
import { AcousticStore, DomainError } from './domain/store.js';

function failure(error: unknown): grpc.ServiceError {
  const code = error instanceof DomainError ? grpc.status[error.code] : grpc.status.INTERNAL;
  return Object.assign(
    new Error(error instanceof DomainError ? error.message : 'Error interno del servicio.'),
    {
      code,
      details: error instanceof DomainError ? error.message : 'Error interno.',
      metadata: new grpc.Metadata(),
    },
  );
}
export function createAcousticServer(store = new AcousticStore(), sweepMs = 10_000) {
  const server = new grpc.Server();
  const handlers: AcousticServiceHandlers = {
    ListSpaces(_call, callback) {
      try {
        callback(null, toWireSnapshot(store.list()));
      } catch (error) {
        callback(failure(error));
      }
    },
    GetSpace(call, callback) {
      try {
        const { space, snapshot } = store.get(call.request.spaceId ?? '');
        callback(null, {
          space: toWireSpace(space),
          serviceInstanceId: snapshot.serviceInstanceId,
          revision: snapshot.revision,
          serverTime: toTimestamp(snapshot.serverTime),
        });
      } catch (error) {
        callback(failure(error));
      }
    },
    SubmitReport(call, callback) {
      try {
        const result = store.submit({
          requestId: call.request.requestId ?? '',
          spaceId: call.request.spaceId ?? '',
          level: call.request.level ?? 0,
        });
        console.log(
          JSON.stringify({
            service: 'acoustic',
            rpc: 'SubmitReport',
            revision: result.snapshot.revision,
            duplicate: result.duplicate,
          }),
        );
        callback(null, {
          report: toWireReport(result.report),
          snapshot: toWireSnapshot(result.snapshot),
          duplicate: result.duplicate,
        });
      } catch (error) {
        callback(failure(error));
      }
    },
    WatchSpaces(call) {
      let blocked = false;
      let pending: SnapshotEvent | undefined;
      let slow: ReturnType<typeof setTimeout> | undefined;
      let cleanup = () => {};
      const send = (event: SnapshotEvent) => {
        if (call.cancelled || call.destroyed) return;
        if (blocked) {
          pending = event;
          return;
        }
        blocked = !call.write(toWireEvent(event));
        if (blocked)
          slow = setTimeout(() => {
            cleanup();
            call.destroy(
              failure(new DomainError('RESOURCE_EXHAUSTED', 'Suscriptor demasiado lento.')),
            );
          }, 30_000);
      };
      const drain = () => {
        blocked = false;
        clearTimeout(slow);
        const next = pending;
        pending = undefined;
        if (next) send(next);
      };
      call.on('drain', drain);
      call.on('error', () => cleanup());
      try {
        const unwatch = store.watch(send);
        const rotation = setTimeout(() => {
          cleanup();
          call.end();
        }, 50 * 60_000);
        cleanup = () => {
          unwatch();
          clearTimeout(slow);
          clearTimeout(rotation);
          pending = undefined;
          call.off('drain', drain);
        };
        call.on('cancelled', cleanup);
        call.on('close', cleanup);
      } catch (error) {
        call.destroy(failure(error));
      }
    },
  };
  server.addService(AcousticService.service, handlers);
  const sweep = setInterval(() => store.sweep(), sweepMs);
  sweep.unref();
  return { server, store, stopTimer: () => clearInterval(sweep) };
}
export function bindServer(server: grpc.Server, address: string): Promise<number> {
  return new Promise((resolve, reject) =>
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) =>
      error ? reject(error) : resolve(port),
    ),
  );
}
