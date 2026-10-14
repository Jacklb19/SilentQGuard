import { useEffect, useMemo, useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Check,
  Clock3,
  Coffee,
  FlaskConical,
  Leaf,
  MapPin,
  Radio,
  Search,
  Users,
  Volume2,
  VolumeX,
  X,
  WifiOff,
  ArrowRight,
} from 'lucide-react';
import type {
  Space,
  AcousticStatus,
  ReportRequest,
} from '../../../packages/http-contracts/src/index';
import { submitReport } from './lib/api';
import { useSpaces } from './hooks/useSpaces';

const labels: Record<AcousticStatus, string> = {
  NO_DATA: 'Sin datos',
  QUIET: 'Tranquilo',
  MODERATE: 'Moderado',
  LOUD: 'Ruidoso',
};
const options = ['Muy tranquilo', 'Tranquilo', 'Moderado', 'Ruidoso', 'Muy ruidoso'];
const icons = [BookOpen, Users, Coffee, FlaskConical];
const ids = ['biblioteca-central', 'sala-estudio-a', 'cafeteria', 'laboratorio-3'];
function ago(time: string | null, now: number) {
  if (!time) return 'Sin reportes recientes';
  const minutes = Math.max(0, Math.floor((now - Date.parse(time)) / 60_000));
  return minutes === 0 ? 'Hace un momento' : `Hace ${minutes} min`;
}
function Badge({ status }: { status: AcousticStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <span className="status-dot" />
      {labels[status]}
    </span>
  );
}
function ReportDialog({
  space,
  onClose,
  onSuccess,
}: {
  space: Space | null;
  onClose: () => void;
  onSuccess: (snapshot: Parameters<ReturnType<typeof useSpaces>['acceptResponse']>[0]) => void;
}) {
  const [level, setLevel] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<ReportRequest | undefined>(undefined);
  const activeSpace = useRef(space?.id);
  activeSpace.current = space?.id;
  useEffect(() => {
    setLevel(undefined);
    setError('');
    pending.current = undefined;
  }, [space?.id]);
  async function send() {
    if (!space || !level || busy) return;
    setBusy(true);
    setError('');
    const report = pending.current ?? { requestId: crypto.randomUUID(), spaceId: space.id, level };
    pending.current = report;
    try {
      const result = await submitReport(report);
      onSuccess(result.snapshot);
      if (activeSpace.current === report.spaceId) onClose();
      pending.current = undefined;
    } catch (error) {
      if (activeSpace.current === report.spaceId)
        setError(error instanceof Error ? error.message : 'No pudimos enviar el reporte.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root
      open={!!space}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal">
          <div className="modal-symbol">
            <Volume2 size={22} />
          </div>
          <Dialog.Close className="icon-button modal-close" aria-label="Cerrar reporte">
            <X size={20} />
          </Dialog.Close>
          <span className="eyebrow">TU REPORTE AYUDA</span>
          <Dialog.Title>
            ¿Cómo está
            <br />
            {space?.name}?
          </Dialog.Title>
          <Dialog.Description>Reporta el ruido que percibes ahora.</Dialog.Description>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <fieldset disabled={busy || !!pending.current} className="noise-options">
              <legend className="sr-only">Nivel de ruido</legend>
              {options.map((label, index) => (
                <label
                  key={label}
                  className={`noise-option ${level === index + 1 ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="noise"
                    value={index + 1}
                    checked={level === index + 1}
                    onChange={() => setLevel(index + 1)}
                  />
                  <span className="option-number">0{index + 1}</span>
                  <span>{label}</span>
                  <span className="option-radio">{level === index + 1 && <Check size={13} />}</span>
                </label>
              ))}
            </fieldset>
            <p className="modal-note">Es una percepción, no una medición en decibelios.</p>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button className="button-secondary" type="button" onClick={onClose}>
                Cancelar
              </button>
              <button className="button-primary" disabled={!level || busy} type="submit">
                {busy ? 'Enviando…' : pending.current ? 'Reintentar envío' : 'Enviar reporte'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function App() {
  const { snapshot, connection, error, reload, acceptResponse } = useSpaces();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [order, setOrder] = useState('quiet');
  const [selected, setSelected] = useState<Space | null>(null);
  const [toast, setToast] = useState('');
  const [now, setNow] = useState(Date.now());
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const spaces = useMemo(() => {
    const list = (snapshot?.spaces ?? []).filter(
      (space) =>
        (filter === 'ALL' || space.status === filter) &&
        `${space.name} ${space.location}`
          .toLocaleLowerCase('es')
          .includes(search.toLocaleLowerCase('es')),
    );
    return list.sort((a, b) =>
      order === 'name'
        ? a.name.localeCompare(b.name, 'es')
        : order === 'recent'
          ? (b.lastReportedAt ? Date.parse(b.lastReportedAt) : 0) -
              (a.lastReportedAt ? Date.parse(a.lastReportedAt) : 0) ||
            a.name.localeCompare(b.name, 'es')
          : (a.averageNoise ?? Infinity) - (b.averageNoise ?? Infinity) ||
            a.name.localeCompare(b.name, 'es'),
    );
  }, [snapshot, search, filter, order]);
  const quiet = snapshot?.spaces.filter((space) => space.status === 'QUIET').length ?? 0;
  const noData = snapshot?.spaces.every((space) => space.status === 'NO_DATA');
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="SilentRadar, inicio">
            <span className="brand-mark">
              <Radio size={22} strokeWidth={1.5} />
            </span>
            SilentRadar<span className="brand-period">.</span>
          </a>
          <div className="header-right">
            <span className="campus-label">
              <MapPin size={14} />
              Vida en el campus
            </span>
            <span className={`connection connection-${connection}`} role="status">
              {connection === 'live' ? (
                <>
                  <span />
                  En vivo
                </>
              ) : (
                <>
                  <WifiOff size={13} />
                  {connection === 'syncing' ? 'Conectando' : 'Reconectando'}
                </>
              )}
            </span>
          </div>
        </div>
      </header>
      <main>
        <section className="intro">
          <div className="intro-copy">
            <div className="eyebrow">
              <span className="tiny-line" />
              ESPACIOS PARA ESTUDIAR
            </div>
            <h1>
              Un lugar para
              <br />
              <em>concentrarte.</em>
            </h1>
            <p>
              Menos ruido. Más enfoque.
              <br className="mobile-break" /> Encuentra tu rincón en el campus.
            </p>
          </div>
          <aside className="quiet-note">
            <span className="note-icon">
              <Leaf size={25} strokeWidth={1.4} />
            </span>
            <span className="eyebrow">EL CAMPUS, AHORA</span>
            <div className="quiet-count">
              {snapshot ? String(quiet).padStart(2, '0') : '—'}
              <span>
                espacios
                <br /> tranquilos
              </span>
            </div>
            <p>
              {snapshot
                ? quiet
                  ? 'Un buen momento para concentrarte.'
                  : 'Tu reporte puede orientar a alguien.'
                : 'Consultando los reportes recientes.'}
            </p>
          </aside>
        </section>
        <section className="directory" aria-labelledby="directory-title">
          <div className="section-heading">
            <div>
              <h2 id="directory-title">
                Encuentra tu espacio
                <span className="count-label">
                  {snapshot ? `${snapshot.spaces.length} lugares` : 'Cargando'}
                </span>
              </h2>
              <p>Según los reportes de los últimos 30 minutos.</p>
            </div>
            <span className="window-label">
              <Clock3 size={15} />
              Información reciente
            </span>
          </div>
          <div className="toolbar">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar espacio o ubicación"
                placeholder="Buscar un espacio…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearch('')}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <div className="select-wrap">
              <label className="sr-only" htmlFor="filter">
                Filtrar por estado
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="ALL">Todos los estados</option>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <div className="select-wrap order-select">
              <label className="sr-only" htmlFor="order">
                Ordenar espacios
              </label>
              <select id="order" value={order} onChange={(event) => setOrder(event.target.value)}>
                <option value="quiet">Más tranquilos primero</option>
                <option value="name">Por nombre</option>
                <option value="recent">Reporte más reciente</option>
              </select>
              <ChevronDown size={14} />
            </div>
          </div>
          {connection === 'reconnecting' && snapshot && (
            <div className="notice">
              <WifiOff size={16} />
              <span>La actualización en vivo está interrumpida. Estamos reconectando.</span>
              <button onClick={reload}>Volver a conectar</button>
            </div>
          )}
          {error && (
            <div role="alert" className="notice error-notice">
              <span>{error}</span>
              <button onClick={reload}>Reintentar</button>
            </div>
          )}
          <div className="space-list">
            <div className="list-heading" aria-hidden="true">
              <span>ESPACIO</span>
              <span>AMBIENTE</span>
              <span>ÚLTIMO REPORTE</span>
              <span />
            </div>
            {!snapshot &&
              !error &&
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-row skeleton-row" aria-hidden="true">
                  <span className="skeleton skeleton-icon" />
                  <div>
                    <span className="skeleton skeleton-title" />
                    <span className="skeleton skeleton-text" />
                  </div>
                  <span className="skeleton skeleton-badge" />
                </div>
              ))}
            {snapshot &&
              spaces.map((space) => {
                const index = ids.indexOf(space.id);
                const Icon = icons[index] ?? BookOpen;
                return (
                  <article className="space-row" key={space.id}>
                    <div className="space-identity">
                      <div className="space-icon">
                        <Icon size={23} strokeWidth={1.5} />
                      </div>
                      <div>
                        <span className="space-number">0{index + 1}</span>
                        <h3>{space.name}</h3>
                        <p>{space.location}</p>
                      </div>
                    </div>
                    <div className="space-status">
                      <Badge status={space.status} />
                      <div
                        className="noise-meter"
                        aria-label={
                          space.averageNoise === null
                            ? 'Sin datos recientes'
                            : `Promedio aproximado ${space.averageNoise.toFixed(1)} de 5`
                        }
                      >
                        <div
                          className={`meter-bars meter-${space.status.toLowerCase()}`}
                          aria-hidden="true"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <i
                              key={n}
                              className={
                                space.averageNoise !== null && n <= Math.round(space.averageNoise)
                                  ? 'filled'
                                  : ''
                              }
                            />
                          ))}
                        </div>
                        <span>
                          {space.averageNoise === null
                            ? '—'
                            : `${space.averageNoise.toFixed(1)} / 5`}
                        </span>
                      </div>
                    </div>
                    <div className="space-recency">
                      <span
                        title={
                          space.lastReportedAt
                            ? new Date(space.lastReportedAt).toLocaleString('es')
                            : undefined
                        }
                      >
                        {ago(space.lastReportedAt, now)}
                      </span>
                      <p>
                        {space.recentReportCount
                          ? `${space.recentReportCount} ${space.recentReportCount === 1 ? 'reporte' : 'reportes'}`
                          : 'Sé el primero en reportar'}
                      </p>
                    </div>
                    <button
                      className="report-button"
                      aria-label={`Reportar ruido en ${space.name}`}
                      onClick={(event) => {
                        lastTrigger.current = event.currentTarget;
                        setSelected(space);
                      }}
                    >
                      Reportar
                      <ArrowUpRight size={17} />
                    </button>
                  </article>
                );
              })}
            {snapshot && spaces.length === 0 && (
              <div className="empty-state">
                <Search size={26} />
                <h3>No hay espacios con este filtro.</h3>
                <p>Prueba otro estado o busca por ubicación.</p>
                <button
                  className="button-secondary"
                  onClick={() => {
                    setSearch('');
                    setFilter('ALL');
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
          {noData && (
            <div className="first-report">
              <VolumeX size={19} />
              <p>
                Todavía no hay reportes recientes.
                <span> Puedes enviar el primero y ayudar a alguien a elegir.</span>
              </p>
            </div>
          )}
        </section>
        <section className="community-note">
          <div className="community-symbol">
            <Users size={24} strokeWidth={1.4} />
          </div>
          <div>
            <h2>Un pequeño reporte. Una gran ayuda.</h2>
            <p>
              ¿Estás en uno de estos lugares? Cuéntanos cómo se escucha.
              <br className="desktop-break" /> Así, el siguiente estudiante sabrá dónde encontrar
              calma.
            </p>
          </div>
          <span className="community-tag">
            HECHO ENTRE ESTUDIANTES
            <ArrowUpRight size={16} />
          </span>
        </section>
        <footer>
          <span>
            SilentRadar<span className="brand-period">.</span>
            <span className="footer-separator">/</span>El silencio también se comparte.
          </span>
          <p>Percepciones de estudiantes. Las condiciones pueden cambiar.</p>
        </footer>
      </main>
      <div className="sr-only" role="status">
        {toast}
      </div>
      {toast && (
        <div className="toast">
          <span>
            <Check size={16} />
          </span>
          {toast}
          <button
            className="icon-button"
            aria-label="Cerrar confirmación"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <ReportDialog
        space={selected}
        onClose={() => {
          setSelected(null);
          requestAnimationFrame(() => lastTrigger.current?.focus());
        }}
        onSuccess={(data) => {
          acceptResponse(data);
          setToast('Reporte enviado. Gracias por avisar.');
        }}
      />
    </>
  );
}
