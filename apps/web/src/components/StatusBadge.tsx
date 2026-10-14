import { statusLabels } from '../lib/presentation';
import type { AcousticStatus } from '../../../../packages/http-contracts/src/index';
export function StatusBadge({ status }: { status: AcousticStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}
