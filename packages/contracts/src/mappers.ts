import {
  snapshotSchema,
  eventSchema,
  reportResponseSchema,
  type Space,
  type Snapshot,
  type SnapshotEvent,
  type NoiseReport,
} from '../../http-contracts/src/index.js';
import type { Space__Output } from '../generated/silentradar/acoustic/v1/Space.js';
import type { SpaceSnapshot__Output } from '../generated/silentradar/acoustic/v1/SpaceSnapshot.js';
import type { SnapshotEvent__Output } from '../generated/silentradar/acoustic/v1/SnapshotEvent.js';
import type { SubmitReportResponse__Output } from '../generated/silentradar/acoustic/v1/SubmitReportResponse.js';
import type { Timestamp__Output } from '../generated/google/protobuf/Timestamp.js';

export function toTimestamp(iso: string) {
  const millis = Date.parse(iso);
  return { seconds: String(Math.floor(millis / 1000)), nanos: (millis % 1000) * 1_000_000 };
}
function fromTimestamp(timestamp: Timestamp__Output | undefined | null): string {
  if (!timestamp) throw new Error('Missing timestamp');
  return new Date(
    Number(timestamp.seconds ?? '0') * 1000 + Math.floor((timestamp.nanos ?? 0) / 1_000_000),
  ).toISOString();
}
export function toWireSpace(space: Space) {
  const statuses = {
    NO_DATA: 'ACOUSTIC_STATUS_NO_DATA',
    QUIET: 'ACOUSTIC_STATUS_QUIET',
    MODERATE: 'ACOUSTIC_STATUS_MODERATE',
    LOUD: 'ACOUSTIC_STATUS_LOUD',
  } as const;
  return {
    id: space.id,
    name: space.name,
    location: space.location,
    ...(space.averageNoise === null ? {} : { averageNoise: space.averageNoise }),
    status: statuses[space.status],
    recentReportCount: space.recentReportCount,
    ...(space.lastReportedAt === null ? {} : { lastReportedAt: toTimestamp(space.lastReportedAt) }),
  };
}
function fromWireSpace(space: Space__Output) {
  return {
    id: space.id,
    name: space.name,
    location: space.location,
    averageNoise: space.averageNoise ?? null,
    status: space.status?.replace('ACOUSTIC_STATUS_', ''),
    recentReportCount: space.recentReportCount ?? 0,
    lastReportedAt: space.lastReportedAt ? fromTimestamp(space.lastReportedAt) : null,
  };
}
export function toWireSnapshot(snapshot: Snapshot) {
  return {
    ...snapshot,
    serverTime: toTimestamp(snapshot.serverTime),
    spaces: snapshot.spaces.map(toWireSpace),
  };
}
export function fromWireSnapshot(snapshot: SpaceSnapshot__Output) {
  return snapshotSchema.parse({
    ...snapshot,
    revision: snapshot.revision ?? '0',
    serverTime: fromTimestamp(snapshot.serverTime),
    spaces: (snapshot.spaces ?? []).map(fromWireSpace),
  });
}
export function toWireEvent(event: SnapshotEvent) {
  const reasons = {
    INITIAL: 'SNAPSHOT_REASON_INITIAL',
    REPORT_ACCEPTED: 'SNAPSHOT_REASON_REPORT_ACCEPTED',
    REPORTS_EXPIRED: 'SNAPSHOT_REASON_REPORTS_EXPIRED',
  } as const;
  return { reason: reasons[event.reason], snapshot: toWireSnapshot(event.snapshot) };
}
export function fromWireEvent(event: SnapshotEvent__Output) {
  if (!event.snapshot) throw new Error('Missing snapshot');
  return eventSchema.parse({
    reason: event.reason?.replace('SNAPSHOT_REASON_', ''),
    snapshot: fromWireSnapshot(event.snapshot),
  });
}
export function toWireReport(report: NoiseReport) {
  return { ...report, receivedAt: toTimestamp(report.receivedAt) };
}
export function fromWireReportResponse(response: SubmitReportResponse__Output) {
  if (!response.report || !response.snapshot) throw new Error('Invalid report response');
  return reportResponseSchema.parse({
    report: { ...response.report, receivedAt: fromTimestamp(response.report.receivedAt) },
    snapshot: fromWireSnapshot(response.snapshot),
    duplicate: response.duplicate ?? false,
  });
}
export function mapWireSpace(space: Space__Output) {
  return fromWireSpace(space);
}
export function mapWireTime(timestamp: Timestamp__Output | undefined | null) {
  return fromTimestamp(timestamp);
}
