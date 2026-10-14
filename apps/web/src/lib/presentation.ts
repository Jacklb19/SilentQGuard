import type { AcousticStatus, Space } from '../../../../packages/http-contracts/src/index';

export const statusLabels: Record<AcousticStatus, string> = {
  NO_DATA: 'Sin datos',
  QUIET: 'Tranquilo',
  MODERATE: 'Moderado',
  LOUD: 'Ruidoso',
};
export const spaceDetails: Record<string, { number: string; category: string }> = {
  'biblioteca-central': { number: '01', category: 'Lectura y concentración' },
  'sala-estudio-a': { number: '02', category: 'Estudio compartido' },
  cafeteria: { number: '03', category: 'Vida en el campus' },
  'laboratorio-3': { number: '04', category: 'Trabajo y práctica' },
};
export function timeAgo(time: string | null, now: number) {
  if (!time) return 'Sin reportes recientes';
  const minutes = Math.max(0, Math.floor((now - Date.parse(time)) / 60_000));
  return minutes === 0 ? 'Hace un momento' : `Hace ${minutes} min`;
}
export function quietestSpace(spaces: Space[]) {
  return spaces
    .filter((space) => space.averageNoise !== null)
    .sort((a, b) => a.averageNoise! - b.averageNoise! || a.name.localeCompare(b.name, 'es'))[0];
}
