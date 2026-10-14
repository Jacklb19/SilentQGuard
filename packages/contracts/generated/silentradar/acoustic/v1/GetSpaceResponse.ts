// Original file: packages/contracts/acoustic.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../google/protobuf/Timestamp';
import type { Space as _silentradar_acoustic_v1_Space, Space__Output as _silentradar_acoustic_v1_Space__Output } from '../../../silentradar/acoustic/v1/Space';
import type { Long } from '@grpc/proto-loader';

export interface GetSpaceResponse {
  'serviceInstanceId'?: (string);
  'revision'?: (number | string | Long);
  'serverTime'?: (_google_protobuf_Timestamp | null);
  'space'?: (_silentradar_acoustic_v1_Space | null);
}

export interface GetSpaceResponse__Output {
  'serviceInstanceId'?: (string);
  'revision'?: (string);
  'serverTime'?: (_google_protobuf_Timestamp__Output);
  'space'?: (_silentradar_acoustic_v1_Space__Output);
}
