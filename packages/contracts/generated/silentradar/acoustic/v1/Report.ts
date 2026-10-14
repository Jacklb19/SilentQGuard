// Original file: packages/contracts/acoustic.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../google/protobuf/Timestamp';

export interface Report {
  'id'?: (string);
  'requestId'?: (string);
  'spaceId'?: (string);
  'level'?: (number);
  'receivedAt'?: (_google_protobuf_Timestamp | null);
}

export interface Report__Output {
  'id'?: (string);
  'requestId'?: (string);
  'spaceId'?: (string);
  'level'?: (number);
  'receivedAt'?: (_google_protobuf_Timestamp__Output);
}
