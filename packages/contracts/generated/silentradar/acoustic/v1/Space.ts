// Original file: packages/contracts/acoustic.proto

import type { AcousticStatus as _silentradar_acoustic_v1_AcousticStatus, AcousticStatus__Output as _silentradar_acoustic_v1_AcousticStatus__Output } from '../../../silentradar/acoustic/v1/AcousticStatus';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../google/protobuf/Timestamp';

export interface Space {
  'id'?: (string);
  'name'?: (string);
  'location'?: (string);
  'averageNoise'?: (number | string);
  'status'?: (_silentradar_acoustic_v1_AcousticStatus);
  'recentReportCount'?: (number);
  'lastReportedAt'?: (_google_protobuf_Timestamp | null);
  '_averageNoise'?: "averageNoise";
}

export interface Space__Output {
  'id'?: (string);
  'name'?: (string);
  'location'?: (string);
  'averageNoise'?: (number);
  'status'?: (_silentradar_acoustic_v1_AcousticStatus__Output);
  'recentReportCount'?: (number);
  'lastReportedAt'?: (_google_protobuf_Timestamp__Output);
  '_averageNoise'?: "averageNoise";
}
