import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const dev = process.argv[2] === 'dev';
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 500).unref();
}
function run(args, env = {}) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}
const tsx = resolve('node_modules/tsx/dist/cli.mjs');
run(dev ? [tsx, 'apps/acoustic/src/index.ts'] : ['dist/apps/acoustic/src/index.js']);
run(dev ? [tsx, 'apps/gateway/src/index.ts'] : ['dist/apps/gateway/src/index.js']);
if (dev) run([resolve('node_modules/vite/bin/vite.js'), '--config', 'apps/web/vite.config.ts']);
console.log(
  `\nSilentRadar · ${dev ? 'http://localhost:5173' : 'http://localhost:3000'}\nDos backends independientes conectados con gRPC. Ctrl+C para detener.\n`,
);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
