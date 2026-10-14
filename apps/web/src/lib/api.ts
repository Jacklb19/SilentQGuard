import {
  snapshotSchema,
  reportResponseSchema,
  type ReportRequest,
} from '../../../../packages/http-contracts/src/index';
const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
export const apiBase = (env.VITE_API_URL ?? '').replace(/\/$/, '');
export async function request(url: string, options?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiBase}${url}`, {
    ...options,
    signal: AbortSignal.timeout(75_000),
  });
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error('El servicio está iniciando. Espera un momento e inténtalo de nuevo.');
  }
  if (!response.ok) {
    const error = data as { error?: { message?: string } };
    throw new Error(error.error?.message ?? 'No pudimos completar la operación.');
  }
  return data;
}
export async function getSpaces() {
  return snapshotSchema.parse(await request('/api/v1/spaces'));
}
export async function submitReport(report: ReportRequest) {
  return reportResponseSchema.parse(
    await request('/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }),
  );
}
