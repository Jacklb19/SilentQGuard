import { createAcousticServer, bindServer } from './server.js';
import { AcousticStore } from './domain/store.js';
const port = Number(process.env.ACOUSTIC_PORT ?? 50051);
const windowSeconds = Number(process.env.REPORT_WINDOW_SECONDS ?? 1800);
const sweepSeconds = Number(process.env.SWEEP_INTERVAL_SECONDS ?? 10);
if (
  ![port, windowSeconds, sweepSeconds].every((value) => Number.isInteger(value) && value > 0) ||
  port > 65535
)
  throw new Error('Configuración acoustic inválida.');
const app = createAcousticServer(
  new AcousticStore(Date.now, windowSeconds * 1000),
  sweepSeconds * 1000,
);
await bindServer(app.server, `${process.env.ACOUSTIC_HOST ?? '127.0.0.1'}:${port}`);
console.log(JSON.stringify({ service: 'acoustic', transport: 'gRPC HTTP/2', port, windowSeconds }));
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  app.stopTimer();
  app.server.forceShutdown();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
