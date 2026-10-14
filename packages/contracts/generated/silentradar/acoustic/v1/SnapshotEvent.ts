// Original file: packages/contracts/acoustic.proto

import type { SnapshotReason as _silentradar_acoustic_v1_SnapshotReason, SnapshotReason__Output as _silentradar_acoustic_v1_SnapshotReason__Output } from '../../../silentradar/acoustic/v1/SnapshotReason';
import type { SpaceSnapshot as _silentradar_acoustic_v1_SpaceSnapshot, SpaceSnapshot__Output as _silentradar_acoustic_v1_SpaceSnapshot__Output } from '../../../silentradar/acoustic/v1/SpaceSnapshot';

export interface SnapshotEvent {
  'reason'?: (_silentradar_acoustic_v1_SnapshotReason);
  'snapshot'?: (_silentradar_acoustic_v1_SpaceSnapshot | null);
}

export interface SnapshotEvent__Output {
  'reason'?: (_silentradar_acoustic_v1_SnapshotReason__Output);
  'snapshot'?: (_silentradar_acoustic_v1_SpaceSnapshot__Output);
}
