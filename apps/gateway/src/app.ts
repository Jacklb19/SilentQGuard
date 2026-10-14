import express, { type ErrorRequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as grpc from '@grpc/grpc-js';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { AcousticService } from '../../../packages/contracts/src/rpc.js';
import {
  fromWireSnapshot,
  fromWireReportResponse,
  mapWireSpace,
  mapWireTime,
} from '../../../packages/contracts/src/mappers.js';
import {
  reportRequestSchema,
  spaceIdSchema,
  spaceSchema,
} from '../../../packages/http-contracts/src/index.js';
import { StreamBridge } from './bridge.js';
import type { SpaceSnapshot__Output } from '../../../packages/contracts/generated/silentradar/acoustic/v1/SpaceSnapshot.js';
import type { GetSpaceResponse__Output } from '../../../packages/contracts/generated/silentradar/acoustic/v1/GetSpaceResponse.js';
import type { SubmitReportResponse__Output } from '../../../packages/contracts/generated/silentradar/acoustic/v1/SubmitReportResponse.js';

export function unary<T>(invoke: (callback: grpc.requestCallback<T>) => void): Promise<T> {
  return new Promise((resolve, reject) =>
    invoke((error, result) =>
      error ? reject(error) : result ? resolve(result) : reject(new Error('Empty RPC response')),
    ),
  );
}
export function createGateway(options: {
  target: string;
  origins?: string[];
  deadlineMs?: number;
  retryBaseMs?: number;
  rateMax?: number;
  trustProxy?: number | false;
}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ?? false);
  const client = new AcousticService(options.target, grpc.credentials.createInsecure());
  const bridge = new StreamBridge(client, options.retryBaseMs);
  const deadlines = () => ({ deadline: Date.now() + (options.deadlineMs ?? 5000) });
  app.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set({
      'X-Request-Id': res.locals.requestId,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    const origin = req.headers.origin;
    const allowed = options.origins ?? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ];
    let sameHost = false;
    try {
      if (origin) {
        const parsed = new URL(origin);
        sameHost = ['http:', 'https:'].includes(parsed.protocol) && parsed.host === req.get('host');
      }
    } catch {
      /* Invalid origin is rejected. */
    }
    if (origin && !allowed.includes(origin) && !sameHost) {
      res
        .status(403)
        .json({
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Origen no permitido.',
            requestId: res.locals.requestId,
            details: [],
          },
        });
      return;
    }
    if (origin)
      res.set({
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '2kb', strict: true }));
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: options.rateMax ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res
        .status(429)
        .json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Has enviado varios reportes. Espera un minuto e inténtalo de nuevo.',
            requestId: res.locals.requestId,
            details: [],
          },
        }),
  });

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', async (_req, res) => {
    try {
      await unary((callback) => client.listSpaces({}, { deadline: Date.now() + 2000 }, callback));
      res.json({ status: 'ready' });
    } catch {
      res
        .status(503)
        .json({
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'El servicio acústico no está disponible.',
            requestId: res.locals.requestId,
            details: [],
          },
        });
    }
  });
  app.get('/api/v1/spaces', async (_req, res) => {
    const output = await unary<SpaceSnapshot__Output>((callback) =>
      client.listSpaces({}, deadlines(), callback),
    );
    res.json(fromWireSnapshot(output));
  });
  app.get('/api/v1/spaces/:id', async (req, res) => {
    const id = spaceIdSchema.parse(req.params.id);
    const output = await unary<GetSpaceResponse__Output>((callback) =>
      client.getSpace({ spaceId: id }, deadlines(), callback),
    );
    if (!output.space) throw new Error('Missing space');
    res.json({
      serviceInstanceId: output.serviceInstanceId,
      revision: output.revision ?? '0',
      serverTime: mapWireTime(output.serverTime),
      space: spaceSchema.parse(mapWireSpace(output.space)),
    });
  });
  app.post('/api/v1/reports', limiter, async (req, res) => {
    if (!req.is('application/json')) {
      res
        .status(415)
        .json({
          error: {
            code: 'UNSUPPORTED_MEDIA_TYPE',
            message: 'Envía el reporte como JSON.',
            requestId: res.locals.requestId,
            details: [],
          },
        });
      return;
    }
    const input = reportRequestSchema.parse(req.body);
    console.log(
      JSON.stringify({ service: 'gateway', rpc: 'SubmitReport', traceId: res.locals.requestId }),
    );
    const output = await unary<SubmitReportResponse__Output>((callback) =>
      client.submitReport(input, deadlines(), callback),
    );
    const result = fromWireReportResponse(output);
    res.status(result.duplicate ? 200 : 201).json(result);
  });
  app.get('/api/v1/events', (req, res) => {
    if (!bridge.attach(res, req.ip ?? 'unknown'))
      res
        .status(429)
        .json({
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiadas conexiones abiertas.',
            requestId: res.locals.requestId,
            details: [],
          },
        });
  });
  const web = resolve('apps/web/dist');
  if (existsSync(web)) app.use(express.static(web));
  app.use((_req, res) =>
    res
      .status(404)
      .json({
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'Ruta no encontrada.',
          requestId: res.locals.requestId,
          details: [],
        },
      }),
  );
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const map: Record<number, [number, string, string]> = {
      [grpc.status.INVALID_ARGUMENT]: [400, 'INVALID_ARGUMENT', 'Reporte inválido.'],
      [grpc.status.NOT_FOUND]: [404, 'SPACE_NOT_FOUND', 'El espacio no existe.'],
      [grpc.status.ALREADY_EXISTS]: [
        409,
        'IDEMPOTENCY_CONFLICT',
        'El identificador ya se utilizó con otro reporte.',
      ],
      [grpc.status.RESOURCE_EXHAUSTED]: [
        429,
        'RATE_LIMITED',
        'Se alcanzó el límite temporal de reportes.',
      ],
      [grpc.status.UNAVAILABLE]: [
        503,
        'SERVICE_UNAVAILABLE',
        'El servicio no está disponible. Inténtalo de nuevo.',
      ],
      [grpc.status.UNAUTHENTICATED]: [
        502,
        'UPSTREAM_AUTH_ERROR',
        'No pudimos conectar con el servicio acústico.',
      ],
      [grpc.status.PERMISSION_DENIED]: [
        502,
        'UPSTREAM_AUTH_ERROR',
        'No pudimos conectar con el servicio acústico.',
      ],
      [grpc.status.DEADLINE_EXCEEDED]: [
        504,
        'UPSTREAM_TIMEOUT',
        'No pudimos confirmar el envío. Reintenta para comprobarlo.',
      ],
    };
    const validation = error?.name === 'ZodError';
    const malformed = error?.type === 'entity.parse.failed';
    const large = error?.type === 'entity.too.large';
    const [status, code, message] = large
      ? [413, 'PAYLOAD_TOO_LARGE', 'El reporte es demasiado grande.']
      : validation || malformed
        ? [400, 'INVALID_ARGUMENT', 'Selecciona un nivel entre 1 y 5 y revisa el reporte.']
        : (map[error?.code] ?? [500, 'INTERNAL_ERROR', 'No pudimos completar la operación.']);
    if (status >= 500)
      console.error(JSON.stringify({ service: 'gateway', traceId: res.locals.requestId, code }));
    res
      .status(status)
      .json({
        error: {
          code,
          message,
          requestId: res.locals.requestId,
          details: validation
            ? error.issues.map((issue: { path: (string | number)[]; message: string }) => ({
                field: issue.path.join('.'),
                issue: issue.message,
              }))
            : [],
        },
      });
  };
  app.use(errors);
  return {
    app,
    client,
    bridge,
    close: () => {
      bridge.close();
      client.close();
    },
  };
}
