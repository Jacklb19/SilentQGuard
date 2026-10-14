import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Check, Volume2, X } from 'lucide-react';
import type { ReportRequest, Snapshot, Space } from '../../../../packages/http-contracts/src/index';
import { submitReport } from '../lib/api';

const options = [
  ['Muy tranquilo', 'Prácticamente en silencio'],
  ['Tranquilo', 'Puedes concentrarte sin esfuerzo'],
  ['Moderado', 'Se escuchan algunas conversaciones'],
  ['Ruidoso', 'Cuesta mantener la concentración'],
  ['Muy ruidoso', 'Mucho movimiento y ruido alrededor'],
];
export function ReportDialog({
  space,
  onClose,
  onSuccess,
}: {
  space: Space | null;
  onClose: () => void;
  onSuccess: (snapshot: Snapshot) => void;
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
        <Dialog.Content
          className="modal"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById('report-title')?.focus();
          }}
        >
          <div className="modal-symbol">
            <Volume2 size={24} aria-hidden="true" />
          </div>
          <Dialog.Close className="icon-button modal-close" aria-label="Cerrar reporte">
            <X size={20} />
          </Dialog.Close>
          <span className="eyebrow">UNA SEÑAL PARA TU CAMPUS</span>
          <Dialog.Title id="report-title" tabIndex={-1}>
            ¿Cómo se escucha
            <br />
            {space?.name}?
          </Dialog.Title>
          <Dialog.Description>
            Comparte lo que percibes ahora. Tu reporte orientará al siguiente estudiante.
          </Dialog.Description>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <fieldset disabled={busy || !!pending.current} className="noise-options">
              <legend className="sr-only">Nivel de ruido</legend>
              {options.map(([label, description], index) => (
                <label
                  key={label}
                  className={`noise-option ${level === index + 1 ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="noise"
                    value={index + 1}
                    aria-label={`${index + 1} · ${label}`}
                    checked={level === index + 1}
                    onChange={() => setLevel(index + 1)}
                  />
                  <span className="option-number">0{index + 1}</span>
                  <span className="option-copy">
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </span>
                  <span className="option-radio">{level === index + 1 && <Check size={13} />}</span>
                </label>
              ))}
            </fieldset>
            <p className="modal-note">
              Percepción personal · Sin micrófono ni medición de decibelios.
            </p>
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
                {busy ? 'Enviando…' : pending.current ? 'Reintentar envío' : 'Compartir reporte'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
