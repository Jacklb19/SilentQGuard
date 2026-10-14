import * as grpc from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { resolve } from 'node:path';
import type { ProtoGrpcType } from '../generated/acoustic.js';

const definition = loadSync(resolve('packages/contracts/acoustic.proto'), {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: false,
  oneofs: true,
});
const contract = grpc.loadPackageDefinition(definition) as unknown as ProtoGrpcType;
export const AcousticService = contract.silentradar.acoustic.v1.AcousticService;
