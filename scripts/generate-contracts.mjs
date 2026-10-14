import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const result = spawnSync(process.execPath, [
  resolve('node_modules/@grpc/proto-loader/build/bin/proto-loader-gen-types.js'),
  '--grpcLib=@grpc/grpc-js',
  '--longs=String',
  '--enums=String',
  '--oneofs',
  '--outDir=packages/contracts/generated',
  'packages/contracts/acoustic.proto',
], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

function normalize(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) normalize(path);
    else if (entry.name.endsWith('.ts')) {
      const source = readFileSync(path, 'utf8').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
      writeFileSync(path, `${source}\n`);
    }
  }
}
normalize(resolve('packages/contracts/generated'));
