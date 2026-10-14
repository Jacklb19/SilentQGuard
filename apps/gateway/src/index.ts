import { createGateway } from './app.js';
const port = Number(process.env.GATEWAY_PORT ?? process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error('Puerto gateway inválido.');
const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 2)
  throw new Error('Proxy inválido.');
const gateway = createGateway({
  target: process.env.GRPC_TARGET ?? '127.0.0.1:50051',
  origins: process.env.APP_ORIGIN?.split(',').map((value) => value.trim()),
  trustProxy: proxyHops || false,
});
const server = gateway.app.listen(port, '0.0.0.0', () =>
  console.log(
    JSON.stringify({
      service: 'gateway',
      port,
      grpcTarget: process.env.GRPC_TARGET ?? '127.0.0.1:50051',
    }),
  ),
);
let closing = false;
function close() {
  if (closing) return;
  closing = true;
  gateway.close();
  server.close();
  server.closeAllConnections();
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
