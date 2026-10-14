// Original file: packages/contracts/acoustic.proto

import type { Report as _silentradar_acoustic_v1_Report, Report__Output as _silentradar_acoustic_v1_Report__Output } from '../../../silentradar/acoustic/v1/Report';
import type { SpaceSnapshot as _silentradar_acoustic_v1_SpaceSnapshot, SpaceSnapshot__Output as _silentradar_acoustic_v1_SpaceSnapshot__Output } from '../../../silentradar/acoustic/v1/SpaceSnapshot';

export interface SubmitReportResponse {
  'report'?: (_silentradar_acoustic_v1_Report | null);
  'snapshot'?: (_silentradar_acoustic_v1_SpaceSnapshot | null);
  'duplicate'?: (boolean);
}

export interface SubmitReportResponse__Output {
  'report'?: (_silentradar_acoustic_v1_Report__Output);
  'snapshot'?: (_silentradar_acoustic_v1_SpaceSnapshot__Output);
  'duplicate'?: (boolean);
}
