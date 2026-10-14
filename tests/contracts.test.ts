import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { AcousticStore } from '../apps/acoustic/src/domain/store.js';
import { snapshotSchema, reportRequestSchema } from '../packages/http-contracts/src/index.js';
import { AcousticService } from '../packages/contracts/src/rpc.js';
import { toWireSnapshot, fromWireSnapshot } from '../packages/contracts/src/mappers.js';

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
ajv.addSchema(JSON.parse(readFileSync('docs/contracts/http.schema.json', 'utf8')), 'contract');
describe('HTTP and protobuf contract', () => {
  it('compiles all formal JSON schema definitions', () => {
    const schema = JSON.parse(readFileSync('docs/contracts/http.schema.json', 'utf8'));
    for (const name of Object.keys(schema.$defs))
      expect(ajv.getSchema(`contract#/$defs/${name}`)).toBeTypeOf('function');
  });
  it('serializes NO_DATA without a fake zero and preserves a large uint64 revision', () => {
    const snapshot = { ...new AcousticStore().list(), revision: '18446744073709551615' };
    const definition = AcousticService.service.ListSpaces;
    const result = fromWireSnapshot(
      definition.responseDeserialize(definition.responseSerialize(toWireSnapshot(snapshot))),
    );
    expect(result).toEqual(snapshot);
    expect(ajv.getSchema('contract#/$defs/SpaceSnapshot')!(result)).toBe(true);
  });
  it('rejects incoherent status and count using both validators', () => {
    const invalid = { ...new AcousticStore().list().spaces[0], averageNoise: 5, status: 'QUIET' };
    expect(ajv.getSchema('contract#/$defs/Space')!(invalid)).toBe(false);
    const snapshot = new AcousticStore().list();
    expect(
      snapshotSchema.safeParse({ ...snapshot, spaces: [invalid, ...snapshot.spaces.slice(1)] })
        .success,
    ).toBe(false);
  });
  it.each([0, 6, 2.5, '2', null])('rejects invalid JSON level %s in both contracts', (level) => {
    const input = {
      requestId: '123e4567-e89b-42d3-a456-426614174000',
      spaceId: 'cafeteria',
      level,
    };
    expect(ajv.getSchema('contract#/$defs/SubmitReportRequest')!(input)).toBe(false);
    expect(reportRequestSchema.safeParse(input).success).toBe(false);
  });
});
