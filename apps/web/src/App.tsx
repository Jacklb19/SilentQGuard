import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Headphones,
  LayoutGrid,
  Leaf,
  List,
  MapPin,
  Menu,
  MessageSquare,
  Radio,
  Search,
  ShieldCheck,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import type { Space } from '../../../packages/http-contracts/src/index';
import { ConnectionIndicator } from './components/ConnectionIndicator';
import { RadarVisual } from './components/RadarVisual';
import { ReportDialog } from './components/ReportDialog';
import { SpaceCard, SpaceIcon } from './components/SpaceCard';
import { StatusBadge } from './components/StatusBadge';
import { usePageMotion } from './hooks/usePageMotion';
import { useSpaces } from './hooks/useSpaces';
import { quietestSpace, statusLabels } from './lib/presentation';

const navigation = [
  ['inicio', 'Inicio'],
  ['nosotros', 'Qué somos'],
  ['como-funciona', 'Cómo funciona'],
  ['espacios', 'Espacios'],
];
const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Encuentra tu lugar.',
    description: 'Compara los espacios del campus y consulta sus reportes más recientes.',
  },
  {
    number: '02',
    icon: MessageSquare,
    title: 'Comparte una señal.',
    description: '¿Ya estás ahí? Reporta el ruido que percibes con una escala sencilla del 1 al 5.',
  },
  {
    number: '03',
    icon: Headphones,
    title: 'Haz espacio al enfoque.',
    description: 'El siguiente estudiante verá tu reporte en vivo y podrá elegir dónde estudiar.',
  },
];

export function App() {
  const { snapshot, connection, error, reload, acceptResponse } = useSpaces();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [order, setOrder] = useState('quiet');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Space | null>(null);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [now, setNow] = useState(Date.now());
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const activeSection = usePageMotion();
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!mobileMenu) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenu(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [mobileMenu]);
  const allSpaces = snapshot?.spaces ?? [];
  const quiet = allSpaces.filter((space) => space.status === 'QUIET').length;
  const recentReports = allSpaces.reduce((sum, space) => sum + space.recentReportCount, 0);
  const recommendation = quietestSpace(allSpaces);
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
  function report(space: Space, trigger: HTMLButtonElement) {
    lastTrigger.current = trigger;
    setSelected(space);
  }
  return (
    <>
      <a className="skip-link" href="#espacios">
        Ir a los espacios en vivo
      </a>
      <header className="site-header">
        <div className="nav-shell">
          <a
            className="brand"
            href="#inicio"
            aria-label="SilentRadar, inicio"
            onClick={() => setMobileMenu(false)}
          >
            <span className="brand-mark">
              <Radio size={22} strokeWidth={1.7} aria-hidden="true" />
            </span>
            SilentRadar<span className="brand-period">.</span>
          </a>
          <nav
            className={`site-nav ${mobileMenu ? 'nav-open' : ''}`}
            aria-label="Navegación principal"
            id="site-navigation"
          >
            {navigation.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className={activeSection === id ? 'nav-active' : ''}
                aria-current={activeSection === id ? 'location' : undefined}
                onClick={() => setMobileMenu(false)}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <ConnectionIndicator connection={connection} />
            <a className="button-primary nav-cta" href="#espacios">
              Explorar el campus
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button
              className="icon-button menu-toggle"
              aria-label={mobileMenu ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenu}
              aria-controls="site-navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero section-container" id="inicio" data-nav-section>
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="kicker-dot" />
              <span>UNA NUEVA FORMA DE ENCONTRAR CALMA</span>
              <ArrowUpRight size={12} aria-hidden="true" />
            </span>
            <h1>
              Tu espacio de estudio.
              <br />
              <em>Tu momento de calma.</em>
            </h1>
            <p>
              Menos vueltas por el campus. Más tiempo para lo que importa.
              <br className="desktop-break" /> Encuentra un lugar tranquilo con los reportes de tu
              comunidad.
            </p>
            <div className="hero-actions">
              <a href="#espacios" className="button-primary button-large">
                Encontrar mi espacio
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a href="#nosotros" className="button-text">
                Conoce SilentRadar
                <ArrowDown size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="hero-assurances">
              <span>
                <Check size={13} aria-hidden="true" />
                Gratis y sin registro
              </span>
              <i />
              <span>
                <Check size={13} aria-hidden="true" />
                Actualizaciones en vivo
              </span>
            </div>
          </div>
          <div className="product-preview">
            <div className="preview-topbar">
              <div className="preview-brand">
                <Radio size={17} aria-hidden="true" />
                <strong>Tu campus, en un vistazo</strong>
                <span className="preview-divider" />
                <span className="preview-label">Espacios de estudio</span>
              </div>
              <span className="preview-window">
                <Clock3 size={13} aria-hidden="true" />
                Últimos 30 min
              </span>
            </div>
            <div className="preview-body">
              <div className="preview-directory">
                <div className="preview-directory-title">
                  <span>EL AMBIENTE, AHORA</span>
                  <span>{snapshot ? `${allSpaces.length} espacios` : 'Consultando…'}</span>
                </div>
                {snapshot
                  ? allSpaces.map((space) => (
                      <div className="preview-row" key={space.id}>
                        <div className="preview-space-icon">
                          <SpaceIcon id={space.id} size={19} />
                        </div>
                        <div className="preview-space-copy">
                          <strong>{space.name}</strong>
                          <span>{space.location}</span>
                        </div>
                        <StatusBadge status={space.status} />
                        <button
                          className="preview-report icon-button"
                          aria-label={`Reportar desde la vista previa en ${space.name}`}
                          onClick={(event) => report(space, event.currentTarget)}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </div>
                    ))
                  : Array.from({ length: 4 }, (_, index) => (
                      <div className="preview-row preview-skeleton" key={index} aria-hidden="true">
                        <span className="skeleton skeleton-icon" />
                        <span className="skeleton skeleton-line" />
                        <span className="skeleton skeleton-pill" />
                      </div>
                    ))}
                {!snapshot && error && (
                  <p className="preview-error">
                    El campus está temporalmente sin conexión.{' '}
                    <button onClick={reload}>Reintentar</button>
                  </p>
                )}
                <div className="preview-footnote">
                  <ShieldCheck size={13} aria-hidden="true" />
                  Percepciones compartidas. Información que se renueva.
                </div>
              </div>
              <aside className="signal-panel">
                <div className="signal-panel-heading">
                  <span className="signal-dot" />
                  <span>CADA REPORTE CUENTA</span>
                </div>
                <RadarVisual spaces={allSpaces} live={connection === 'live'} />
                <div className="signal-panel-copy">
                  <span className="signal-count">
                    {snapshot ? String(recentReports).padStart(2, '0') : '—'}
                  </span>
                  <div>
                    <strong>señales recientes</strong>
                    <span>Un campus que se escucha.</span>
                  </div>
                </div>
                <div className="signal-panel-footer">
                  <span>Comunidad → calma</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </div>
              </aside>
            </div>
          </div>
          <div className="hero-baseline">
            <span>DISEÑADO PARA LA VIDA UNIVERSITARIA</span>
            <div>
              <MapPin size={14} aria-hidden="true" />
              <span>Bibliotecas</span>
              <span className="baseline-dot" />
              <span>Salas de estudio</span>
              <span className="baseline-dot" />
              <span>Zonas comunes</span>
            </div>
          </div>
        </section>

        <section className="about-section section-container" id="nosotros" data-nav-section>
          <div className="about-intro" data-reveal>
            <span className="eyebrow">
              <span className="eyebrow-line" />
              QUÉ SOMOS
            </span>
            <h2>
              El buen enfoque
              <br />
              empieza con <em>un buen lugar.</em>
            </h2>
            <p>
              SilentRadar conecta lo que sabes de un espacio con alguien que está buscando dónde
              estudiar.
            </p>
            <p>
              Somos una herramienta colaborativa para estudiantes: una forma sencilla de compartir
              el ambiente del campus y tomar una mejor decisión antes de moverte.
            </p>
            <a className="inline-link" href="#como-funciona">
              Así se comparte la calma
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="about-benefits" data-reveal>
            <div className="benefit">
              <span className="benefit-icon">
                <MapPin size={22} aria-hidden="true" />
              </span>
              <div>
                <h3>Tu tiempo, de vuelta.</h3>
                <p>
                  Consulta el ambiente antes de recorrer el campus buscando un lugar para
                  concentrarte.
                </p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">
                <Clock3 size={22} aria-hidden="true" />
              </span>
              <div>
                <h3>Una señal que sí es reciente.</h3>
                <p>
                  Solo cuentan los reportes de los últimos 30 minutos. Cuando vencen, el espacio
                  vuelve a quedar sin datos.
                </p>
              </div>
            </div>
            <div className="benefit">
              <span className="benefit-icon">
                <Users size={22} aria-hidden="true" />
              </span>
              <div>
                <h3>Hecho entre estudiantes.</h3>
                <p>
                  Sin registros ni micrófonos. Tu percepción puede ayudar al siguiente estudiante a
                  encontrar calma.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-section section-container" id="como-funciona" data-nav-section>
          <div className="how-surface" data-reveal>
            <div className="how-heading">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-line" />
                  SIMPLE POR DISEÑO
                </span>
                <h2>
                  De una señal a<br />
                  <em>una mejor decisión.</em>
                </h2>
              </div>
              <p>
                No hace falta complicarlo.
                <br />
                Tres pasos, un campus más fácil de habitar.
              </p>
            </div>
            <div className="steps">
              {steps.map(({ number, icon: Icon, title, description }) => (
                <div className="step" key={number}>
                  <div className="step-top">
                    <span>{number}</span>
                    <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
            <div className="how-footer">
              <span>
                <ShieldCheck size={15} aria-hidden="true" />
                Tu percepción. Sin grabaciones.
              </span>
              <a href="#espacios">
                Pruébalo ahora
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="spaces-section section-container" id="espacios" data-nav-section>
          <div className="directory-intro" data-reveal>
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" />
                EXPLORA TU CAMPUS
              </span>
              <h2>
                Espacios, <em>en tiempo real.</em>
              </h2>
              <p>Elige dónde estudiar. Comparte cómo se escucha.</p>
            </div>
            <ConnectionIndicator connection={connection} />
          </div>
          <div className="campus-overview" data-reveal>
            <div className="overview-item">
              <span className="overview-icon">
                <MapPin size={19} aria-hidden="true" />
              </span>
              <div>
                <strong>{snapshot ? String(allSpaces.length).padStart(2, '0') : '—'}</strong>
                <span>espacios del campus</span>
              </div>
            </div>
            <div className="overview-item">
              <span className="overview-icon">
                <Leaf size={19} aria-hidden="true" />
              </span>
              <div>
                <strong>{snapshot ? String(quiet).padStart(2, '0') : '—'}</strong>
                <span>tranquilos ahora</span>
              </div>
            </div>
            <div className="overview-item">
              <span className="overview-icon">
                <MessageSquare size={19} aria-hidden="true" />
              </span>
              <div>
                <strong>{snapshot ? String(recentReports).padStart(2, '0') : '—'}</strong>
                <span>reportes recientes</span>
              </div>
            </div>
            <div className="overview-window">
              <Clock3 size={16} aria-hidden="true" />
              <div>
                <strong>Una ventana de 30 min</strong>
                <span>La información cambia contigo.</span>
              </div>
            </div>
          </div>
          <div className="directory-controls">
            <div className="status-tabs" role="group" aria-label="Filtrar espacios por estado">
              {[
                ['ALL', 'Todos'],
                ['QUIET', 'Tranquilos'],
                ['MODERATE', 'Moderados'],
                ['LOUD', 'Ruidosos'],
                ['NO_DATA', 'Sin datos'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? 'tab-active' : ''}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  {value === 'ALL' && snapshot && <span>{allSpaces.length}</span>}
                </button>
              ))}
            </div>
            <div className="view-switch" role="group" aria-label="Vista de espacios">
              <button
                aria-label="Vista de tarjetas"
                aria-pressed={view === 'grid'}
                className={view === 'grid' ? 'view-active' : ''}
                onClick={() => setView('grid')}
              >
                <LayoutGrid size={17} />
              </button>
              <button
                aria-label="Vista de lista"
                aria-pressed={view === 'list'}
                className={view === 'list' ? 'view-active' : ''}
                onClick={() => setView('list')}
              >
                <List size={19} />
              </button>
            </div>
          </div>
          <div className="toolbar">
            <div className="search-field">
              <Search size={17} aria-hidden="true" />
              <input
                aria-label="Buscar espacio o ubicación"
                placeholder="Busca un espacio o una ubicación…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Borrar búsqueda"
                  onClick={() => setSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="select-wrap filter-select">
              <label className="sr-only" htmlFor="filter">
                Filtrar por estado
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="ALL">Todos los estados</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
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
              <ChevronDown size={14} aria-hidden="true" />
            </div>
          </div>
          {connection === 'reconnecting' && snapshot && (
            <div className="notice">
              <WifiOff size={17} aria-hidden="true" />
              <span>
                La actualización en vivo está interrumpida. Conservamos la última información
                recibida.
              </span>
              <button onClick={reload}>Volver a conectar</button>
            </div>
          )}
          {error && (
            <div role="alert" className="notice error-notice">
              <span>{error}</span>
              <button onClick={reload}>Reintentar</button>
            </div>
          )}
          <div className={`space-grid space-view-${view}`}>
            {!snapshot &&
              !error &&
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="space-card skeleton-card" aria-hidden="true">
                  <span className="skeleton skeleton-icon" />
                  <span className="skeleton skeleton-title" />
                  <span className="skeleton skeleton-line" />
                  <span className="skeleton skeleton-state" />
                  <span className="skeleton skeleton-line" />
                </div>
              ))}
            {snapshot &&
              spaces.map((space) => (
                <SpaceCard key={space.id} space={space} now={now} onReport={report} />
              ))}
            {snapshot && spaces.length === 0 && (
              <div className="empty-state">
                <span>
                  <Search size={26} aria-hidden="true" />
                </span>
                <h3>No hay espacios con este filtro.</h3>
                <p>Prueba otra búsqueda o explora todos los estados.</p>
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
          <div className="directory-footnote">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>
              Reportes de percepción, no mediciones en decibelios. Las condiciones pueden cambiar.
            </span>
          </div>
          {recommendation ? (
            <div className="recommendation">
              <span className="recommendation-icon">
                <Headphones size={21} aria-hidden="true" />
              </span>
              <div>
                <span>EL MENOR PROMEDIO REPORTADO, AHORA</span>
                <strong>{recommendation.name}</strong>
              </div>
              <StatusBadge status={recommendation.status} />
              <a
                href="#espacios"
                className="inline-link"
                onClick={() => {
                  setFilter('ALL');
                  setSearch(recommendation.name);
                }}
              >
                Ver espacio
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          ) : (
            snapshot && (
              <div className="first-report">
                <Radio size={20} aria-hidden="true" />
                <p>
                  Todavía no hay señales recientes.
                  <span>Tu reporte puede ser el comienzo de un campus más tranquilo.</span>
                </p>
              </div>
            )
          )}
        </section>

        <section className="closing-section section-container">
          <div className="closing-surface" data-reveal>
            <span className="closing-icon">
              <Leaf size={26} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <span className="eyebrow">EL SILENCIO TAMBIÉN SE COMPARTE</span>
            <h2>
              Haz espacio
              <br />
              para <em>lo que importa.</em>
            </h2>
            <p>Tu próximo momento de enfoque está más cerca de lo que crees.</p>
            <a href="#espacios" className="button-primary button-large">
              Explorar los espacios
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <span className="closing-note">Gratis y sin registro. Hecho entre estudiantes.</span>
          </div>
        </section>
      </main>
      <footer className="site-footer section-container">
        <div className="footer-top">
          <a className="brand" href="#inicio" aria-label="SilentRadar, volver al inicio">
            <span className="brand-mark">
              <Radio size={21} aria-hidden="true" />
            </span>
            SilentRadar<span className="brand-period">.</span>
          </a>
          <p>
            Una señal compartida.
            <br />
            Un mejor lugar para estudiar.
          </p>
          <a href="#inicio" className="footer-top-link">
            Volver arriba
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div className="footer-bottom">
          <span>Creado para la comunidad universitaria.</span>
          <span>Reportes anónimos · Ventana de 30 minutos</span>
        </div>
      </footer>
      <div className="sr-only" role="status">
        {toast}
      </div>
      {toast && (
        <div className="toast">
          <span>
            <Check size={16} aria-hidden="true" />
          </span>
          <div>
            <strong>Gracias por compartir.</strong>
            <span>{toast}</span>
          </div>
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
          setToast('Tu reporte ya es una señal para el campus.');
        }}
      />
    </>
  );
}
