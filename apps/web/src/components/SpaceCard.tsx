import { ArrowUpRight, BookOpen, Clock3, Coffee, FlaskConical, MapPin, Users } from 'lucide-react';
import type { Space } from '../../../../packages/http-contracts/src/index';
import { StatusBadge } from './StatusBadge';
import { spaceDetails, timeAgo } from '../lib/presentation';

export function SpaceIcon({ id, size = 23 }: { id: string; size?: number }) {
  const Icon =
    id === 'cafeteria'
      ? Coffee
      : id === 'laboratorio-3'
        ? FlaskConical
        : id === 'sala-estudio-a'
          ? Users
          : BookOpen;
  return <Icon size={size} strokeWidth={1.65} aria-hidden="true" />;
}
export function SpaceCard({
  space,
  now,
  onReport,
}: {
  space: Space;
  now: number;
  onReport: (space: Space, trigger: HTMLButtonElement) => void;
}) {
  const detail = spaceDetails[space.id];
  return (
    <article className={`space-card space-card-${space.status.toLowerCase()}`}>
      <div className="space-card-top">
        <div className="space-icon">
          <SpaceIcon id={space.id} />
        </div>
        <span className="space-category">{detail?.category ?? 'Espacio de estudio'}</span>
        <span className="space-number">{detail?.number}</span>
      </div>
      <div className="space-card-title">
        <h3>{space.name}</h3>
        <p>
          <MapPin size={13} aria-hidden="true" />
          {space.location}
        </p>
      </div>
      <div className="space-card-state">
        <div>
          <span className="field-label">AMBIENTE ACTUAL</span>
          <StatusBadge status={space.status} />
        </div>
        <div
          className="noise-score"
          aria-label={
            space.averageNoise === null
              ? 'Sin datos recientes'
              : `Promedio aproximado ${space.averageNoise.toFixed(1)} de 5`
          }
        >
          <strong>{space.averageNoise === null ? '—' : space.averageNoise.toFixed(1)}</strong>
          <span>/ 5</span>
        </div>
      </div>
      <div className="noise-track" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={
              space.averageNoise !== null && level <= Math.round(space.averageNoise) ? 'filled' : ''
            }
          />
        ))}
      </div>
      <div className="space-card-bottom">
        <div className="space-recency">
          <span
            title={
              space.lastReportedAt ? new Date(space.lastReportedAt).toLocaleString('es') : undefined
            }
          >
            <Clock3 size={12} aria-hidden="true" />
            {timeAgo(space.lastReportedAt, now)}
          </span>
          <p>
            {space.recentReportCount
              ? `${space.recentReportCount} ${space.recentReportCount === 1 ? 'reporte reciente' : 'reportes recientes'}`
              : 'Tu reporte puede ser el primero'}
          </p>
        </div>
        <button
          className="report-button"
          aria-label={`Reportar ruido en ${space.name}`}
          onClick={(event) => onReport(space, event.currentTarget)}
        >
          Reportar
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
