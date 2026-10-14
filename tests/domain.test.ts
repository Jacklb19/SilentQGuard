import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { AcousticStore, classify } from '../apps/acoustic/src/domain/store.js';

describe('Acoustic domain', () => {
  it.each([
    [null, 'NO_DATA'],
    [1, 'QUIET'],
    [2.49, 'QUIET'],
    [2.5, 'MODERATE'],
    [3.49, 'MODERATE'],
    [3.5, 'LOUD'],
    [5, 'LOUD'],
  ] as const)('classifies %s as %s without rounding', (average, expected) =>
    expect(classify(average)).toBe(expected),
  );
  it('starts with four spaces and absent averages', () => {
    const store = new AcousticStore();
    const snapshot = store.list();
    expect(snapshot.revision).toBe('0');
    expect(snapshot.spaces).toHaveLength(4);
    for (const space of snapshot.spaces)
      expect(space).toMatchObject({
        status: 'NO_DATA',
        averageNoise: null,
        lastReportedAt: null,
        recentReportCount: 0,
      });
  });
  it('computes the average and expires reports at the exact boundary without a new report', () => {
    let now = Date.parse('2026-10-14T00:00:00Z');
    const store = new AcousticStore(() => now);
    const events: string[] = [];
    const unwatch = store.watch((event) => events.push(event.reason));
    store.submit({ requestId: randomUUID(), spaceId: 'biblioteca-central', level: 2 });
    now += 60_000;
    const latest = store.submit({
      requestId: randomUUID(),
      spaceId: 'biblioteca-central',
      level: 5,
    });
    expect(store.get('biblioteca-central').space).toMatchObject({
      averageNoise: 3.5,
      status: 'LOUD',
      recentReportCount: 2,
    });
    now += 29 * 60_000;
    store.sweep();
    expect(store.get('biblioteca-central').space).toMatchObject({
      averageNoise: 5,
      recentReportCount: 1,
      lastReportedAt: latest.report.receivedAt,
    });
    now += 60_000;
    store.sweep();
    expect(store.get('biblioteca-central').space).toMatchObject({
      averageNoise: null,
      status: 'NO_DATA',
      recentReportCount: 0,
      lastReportedAt: null,
    });
    expect(events).toEqual([
      'INITIAL',
      'REPORT_ACCEPTED',
      'REPORT_ACCEPTED',
      'REPORTS_EXPIRED',
      'REPORTS_EXPIRED',
    ]);
    unwatch();
  });
  it('deduplicates a retry and rejects an ID with a different payload', () => {
    const store = new AcousticStore();
    const input = { requestId: randomUUID(), spaceId: 'cafeteria', level: 4 };
    const initial = store.submit(input);
    const duplicate = store.submit(input);
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.report.id).toBe(initial.report.id);
    expect(duplicate.snapshot.revision).toBe('1');
    expect(() => store.submit({ ...input, level: 2 })).toThrow('identificador');
    expect(store.get('cafeteria').space.recentReportCount).toBe(1);
  });
  it.each([0, 6, 2.5, NaN])('rejects invalid level %s', (level) => {
    const store = new AcousticStore();
    expect(() => store.submit({ requestId: randomUUID(), spaceId: 'cafeteria', level })).toThrow();
    expect(store.list().revision).toBe('0');
  });
  it('rejects unknown spaces and bounds report storage', () => {
    const store = new AcousticStore();
    expect(() =>
      store.submit({ requestId: randomUUID(), spaceId: 'inexistente', level: 1 }),
    ).toThrow('no existe');
    for (let i = 0; i < 1000; i++)
      store.submit({ requestId: randomUUID(), spaceId: 'cafeteria', level: 1 });
    expect(() => store.submit({ requestId: randomUUID(), spaceId: 'cafeteria', level: 1 })).toThrow(
      'límite',
    );
    expect(store.get('cafeteria').space.recentReportCount).toBe(1000);
  });
});
