import { z } from 'zod';

export const spaceIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const reportRequestSchema = z.strictObject({
  requestId: z.uuid(),
  spaceId: spaceIdSchema,
  level: z.number().int().min(1).max(5),
});
const utc = z.iso.datetime();
const revision = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .max(20)
  .refine((value) => BigInt(value) <= 18446744073709551615n);
export const statusSchema = z.enum(['NO_DATA', 'QUIET', 'MODERATE', 'LOUD']);
export const spaceSchema = z
  .strictObject({
    id: spaceIdSchema,
    name: z.string().min(1).max(100),
    location: z.string().min(1).max(160),
    averageNoise: z.number().min(1).max(5).nullable(),
    status: statusSchema,
    recentReportCount: z.number().int().min(0).max(1000),
    lastReportedAt: utc.nullable(),
  })
  .superRefine((space, ctx) => {
    const noData = space.recentReportCount === 0;
    const expected =
      space.averageNoise === null
        ? 'NO_DATA'
        : space.averageNoise < 2.5
          ? 'QUIET'
          : space.averageNoise < 3.5
            ? 'MODERATE'
            : 'LOUD';
    if (
      space.status !== expected ||
      noData !== (space.averageNoise === null) ||
      noData !== (space.lastReportedAt === null)
    )
      ctx.addIssue({ code: 'custom', message: 'Estado acústico inconsistente.' });
  });
export const snapshotSchema = z.strictObject({
  serviceInstanceId: z.uuid(),
  revision,
  serverTime: utc,
  spaces: z
    .array(spaceSchema)
    .length(4)
    .refine((spaces) => new Set(spaces.map((space) => space.id)).size === 4),
});
export const reportSchema = z.strictObject({
  id: z.uuid(),
  requestId: z.uuid(),
  spaceId: spaceIdSchema,
  level: z.number().int().min(1).max(5),
  receivedAt: utc,
});
export const reportResponseSchema = z.strictObject({
  report: reportSchema,
  snapshot: snapshotSchema,
  duplicate: z.boolean(),
});
export const eventSchema = z.strictObject({
  reason: z.enum(['INITIAL', 'REPORT_ACCEPTED', 'REPORTS_EXPIRED']),
  snapshot: snapshotSchema,
});
export type AcousticStatus = z.infer<typeof statusSchema>;
export type Space = z.infer<typeof spaceSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type NoiseReport = z.infer<typeof reportSchema>;
export type ReportRequest = z.infer<typeof reportRequestSchema>;
export type ReportResponse = z.infer<typeof reportResponseSchema>;
export type SnapshotEvent = z.infer<typeof eventSchema>;
