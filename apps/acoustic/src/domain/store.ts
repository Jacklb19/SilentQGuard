import { randomUUID } from 'node:crypto';
import {
  reportRequestSchema,
  type Snapshot,
  type SnapshotEvent,
  type Space,
  type NoiseReport,
  type ReportRequest,
  type ReportResponse,
  type AcousticStatus,
} from '../../../../packages/http-contracts/src/index.js';

export const catalog = [
  { id: 'biblioteca-central', name: 'Biblioteca central', location: 'Piso 2 · Zona de lectura' },
  { id: 'sala-estudio-a', name: 'Sala de estudio A', location: 'Bloque B · Segundo piso' },
  { id: 'cafeteria', name: 'Cafetería', location: 'Zona común' },
  { id: 'laboratorio-3', name: 'Laboratorio 3', location: 'Bloque de ingeniería' },
];
export class DomainError extends Error {
  constructor(
    public readonly code:
      | 'INVALID_ARGUMENT'
      | 'NOT_FOUND'
      | 'ALREADY_EXISTS'
      | 'RESOURCE_EXHAUSTED',
    message: string,
  ) {
    super(message);
  }
}
export function classify(average: number | null): AcousticStatus {
  return average === null
    ? 'NO_DATA'
    : average < 2.5
      ? 'QUIET'
      : average < 3.5
        ? 'MODERATE'
        : 'LOUD';
}
export class AcousticStore {
  readonly instanceId = randomUUID();
  private revision = 0n;
  private reports = new Map<string, NoiseReport[]>(catalog.map((space) => [space.id, []]));
  private dedup = new Map<string, { report: NoiseReport; expiresAt: number }>();
  private subscribers = new Set<(event: SnapshotEvent) => void>();
  constructor(
    private now: () => number = Date.now,
    readonly windowMs = 30 * 60_000,
  ) {}

  private snapshotAt(now: number): Snapshot {
    return {
      serviceInstanceId: this.instanceId,
      revision: String(this.revision),
      serverTime: new Date(now).toISOString(),
      spaces: catalog.map((definition) => {
        const reports = this.reports.get(definition.id)!;
        const averageNoise = reports.length
          ? reports.reduce((sum, report) => sum + report.level, 0) / reports.length
          : null;
        return {
          ...definition,
          averageNoise,
          status: classify(averageNoise),
          recentReportCount: reports.length,
          lastReportedAt: reports.length ? reports[reports.length - 1].receivedAt : null,
        };
      }),
    };
  }
  private emit(reason: SnapshotEvent['reason'], now: number) {
    const event = { reason, snapshot: this.snapshotAt(now) };
    for (const listener of this.subscribers) listener(event);
  }
  sweep(now = this.now()) {
    let changed = false;
    for (const [id, reports] of this.reports) {
      const recent = reports.filter(
        (report) =>
          Date.parse(report.receivedAt) > now - this.windowMs &&
          Date.parse(report.receivedAt) <= now,
      );
      if (recent.length !== reports.length) {
        this.reports.set(id, recent);
        changed = true;
      }
    }
    for (const [id, entry] of this.dedup) if (entry.expiresAt <= now) this.dedup.delete(id);
    if (changed) {
      this.revision++;
      this.emit('REPORTS_EXPIRED', now);
    }
  }
  list(): Snapshot {
    const now = this.now();
    this.sweep(now);
    return this.snapshotAt(now);
  }
  get(id: string): { snapshot: Snapshot; space: Space } {
    const snapshot = this.list();
    const space = snapshot.spaces.find((space) => space.id === id);
    if (!space) throw new DomainError('NOT_FOUND', 'El espacio no existe.');
    return { snapshot, space };
  }
  submit(input: ReportRequest): ReportResponse {
    const parsed = reportRequestSchema.safeParse(input);
    if (!parsed.success)
      throw new DomainError(
        'INVALID_ARGUMENT',
        'Selecciona un nivel entero entre 1 y 5 y un identificador válido.',
      );
    const now = this.now();
    this.sweep(now);
    const reports = this.reports.get(input.spaceId);
    if (!reports) throw new DomainError('NOT_FOUND', 'El espacio no existe.');
    const existing = this.dedup.get(input.requestId);
    if (existing) {
      if (existing.report.spaceId !== input.spaceId || existing.report.level !== input.level)
        throw new DomainError('ALREADY_EXISTS', 'El identificador ya se utilizó con otro reporte.');
      return { report: { ...existing.report }, snapshot: this.snapshotAt(now), duplicate: true };
    }
    if (reports.length >= 1000 || this.dedup.size >= 5000)
      throw new DomainError('RESOURCE_EXHAUSTED', 'Se alcanzó el límite temporal de reportes.');
    const report: NoiseReport = {
      ...parsed.data,
      id: randomUUID(),
      receivedAt: new Date(now).toISOString(),
    };
    reports.push(report);
    this.dedup.set(input.requestId, { report, expiresAt: now + 35 * 60_000 });
    this.revision++;
    this.emit('REPORT_ACCEPTED', now);
    return { report: { ...report }, snapshot: this.snapshotAt(now), duplicate: false };
  }
  watch(listener: (event: SnapshotEvent) => void): () => void {
    if (this.subscribers.size >= 10)
      throw new DomainError('RESOURCE_EXHAUSTED', 'Demasiadas suscripciones.');
    const snapshot = this.list();
    this.subscribers.add(listener);
    listener({ reason: 'INITIAL', snapshot });
    return () => this.subscribers.delete(listener);
  }
}
