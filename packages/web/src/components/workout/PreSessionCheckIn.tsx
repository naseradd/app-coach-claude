import { useState } from 'react';
import { Button, Sheet, Stepper } from '../ui/index.js';
import type { PreSessionCheckIn as PreSessionData } from '../../store/workout.store.js';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: PreSessionData) => void;
}

/**
 * Pre-session check-in sheet. Captures subjective state (energy / sleep /
 * soreness) on a 1-10 scale before the workout starts. Skipping fills the
 * fields with null — Claude can still parse the report, just with fewer
 * signal channels.
 *
 * Design choice: Stepper rather than RPESegmented because 3 segmented rows of
 * 10 buttons is too dense on a 375px-wide screen. The +/- pattern also
 * scales smoothly down to one-handed use.
 */
export function PreSessionCheckIn({ open, onClose, onConfirm }: Props) {
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [soreness, setSoreness] = useState(3);
  const [notes, setNotes] = useState('');

  const submit = () => {
    onConfirm({
      energy_level: energy,
      sleep_quality: sleep,
      soreness_level: soreness,
      notes,
    });
  };

  const skip = () => {
    onConfirm({
      energy_level: null,
      sleep_quality: null,
      soreness_level: null,
      notes: '',
    });
  };

  return (
    <Sheet open={open} onClose={onClose} detent="large">
      <div style={{ display: 'grid', gap: 18, paddingBottom: 24 }}>
        <div>
          <h2 className="t-title-2" style={{ margin: 0, color: 'var(--ink)' }}>
            Avant de commencer
          </h2>
          <p className="t-callout" style={{ color: 'var(--ink-3)', margin: '6px 0 0' }}>
            3 questions rapides pour calibrer la séance.
          </p>
        </div>

        <Stepper
          label="Énergie"
          value={energy}
          min={1}
          max={10}
          onChange={setEnergy}
          hint="1 = épuisé · 10 = au top"
        />
        <Stepper
          label="Qualité du sommeil"
          value={sleep}
          min={1}
          max={10}
          onChange={setSleep}
          hint="1 = très mauvaise · 10 = excellente"
        />
        <Stepper
          label="Courbatures"
          value={soreness}
          min={1}
          max={10}
          onChange={setSoreness}
          hint="1 = aucune · 10 = très douloureuses"
        />

        <div>
          <div className="t-subhead" style={{ color: 'var(--ink-3)', marginBottom: 8 }}>
            Notes
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Quelque chose à signaler ?"
            rows={2}
            style={{
              width: '100%',
              border: 0,
              outline: 0,
              background: 'var(--bg-tinted)',
              borderRadius: 18,
              padding: 14,
              fontFamily: 'inherit',
              fontSize: 15,
              color: 'var(--ink)',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          <Button variant="primary" size="xl" fullWidth onClick={submit}>
            Démarrer
          </Button>
          <Button variant="plain" size="md" fullWidth onClick={skip}>
            Sauter
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
