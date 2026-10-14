import { WifiOff } from 'lucide-react';
import type { Connection } from '../hooks/useSpaces';
export function ConnectionIndicator({ connection }: { connection: Connection }) {
  return (
    <span className={`connection connection-${connection}`} role="status">
      {connection === 'live' ? (
        <>
          <span className="live-dot" aria-hidden="true" />
          En vivo
        </>
      ) : (
        <>
          <WifiOff size={13} aria-hidden="true" />
          {connection === 'syncing' ? 'Conectando' : 'Reconectando'}
        </>
      )}
    </span>
  );
}
