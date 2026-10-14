import { useCallback, useEffect, useRef, useState } from 'react';
import { eventSchema, type Snapshot } from '../../../../packages/http-contracts/src/index';
import { apiBase, getSpaces } from '../lib/api';

export type Connection = 'syncing' | 'live' | 'reconnecting';
export function useSpaces() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [connection, setConnection] = useState<Connection>('syncing');
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const current = useRef<Snapshot | undefined>(undefined);
  const authoritative = useRef(false);
  const apply = useCallback((next: Snapshot, initial = false) => {
    const previous = current.current;
    if (
      initial ||
      !previous ||
      (next.serviceInstanceId === previous.serviceInstanceId &&
        BigInt(next.revision) > BigInt(previous.revision))
    ) {
      current.current = next;
      setSnapshot(next);
      setError('');
    }
  }, []);
  const reload = useCallback(() => setGeneration((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    authoritative.current = false;
    setConnection('syncing');
    setError('');
    const stream = new EventSource(`${apiBase}/api/v1/events`);
    stream.addEventListener('snapshot', (event) => {
      if (!active) return;
      try {
        const data = eventSchema.parse(JSON.parse((event as MessageEvent).data));
        apply(data.snapshot, data.reason === 'INITIAL');
        authoritative.current = true;
        setConnection('live');
      } catch {
        setConnection('reconnecting');
        setError('Recibimos una actualización inválida. Vuelve a conectar.');
      }
    });
    stream.addEventListener('connection', (event) => {
      if (!active) return;
      try {
        const data = JSON.parse((event as MessageEvent).data);
        if (data.status === 'reconnecting' || data.status === 'syncing') setConnection(data.status);
      } catch {
        setConnection('reconnecting');
      }
    });
    stream.onerror = () => {
      if (active) setConnection('reconnecting');
    };
    void getSpaces()
      .then((data) => {
        if (active && !authoritative.current) apply(data, true);
      })
      .catch((error) => {
        if (active && !authoritative.current)
          setError(error instanceof Error ? error.message : 'No pudimos cargar los espacios.');
      });
    return () => {
      active = false;
      stream.close();
    };
  }, [generation, apply]);
  const acceptResponse = (next: Snapshot) => {
    if (current.current && current.current.serviceInstanceId !== next.serviceInstanceId) {
      reload();
      return;
    }
    apply(next);
  };
  return { snapshot, connection, error, reload, acceptResponse };
}
