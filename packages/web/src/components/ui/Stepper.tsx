import { motion, AnimatePresence } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { spring } from '../../design/motion.js';

interface Props {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  hint?: string;
}

export function Stepper({ label, value, unit, step = 1, min, max, onChange, hint }: Props) {
  const dec = () => onChange(Math.max(min ?? -Infinity, value - step));
  const inc = () => onChange(Math.min(max ?? Infinity, value + step));
  return (
    <div className="t-subhead" style={{ display: 'grid', gap: 8 }}>
      <div style={{ color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <motion.button
          onClick={dec}
          whileTap={{ scale: 0.94 }}
          transition={spring.tap}
          style={{
            width: 48, height: 48, borderRadius: 999,
            background: 'var(--bg-tinted)', color: 'var(--ink)',
            display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer',
          }}
          aria-label={`Diminuer ${label}`}
        >
          <Minus size={20} />
        </motion.button>
        <div style={{ flex: 1, textAlign: 'center', position: 'relative', minHeight: 44 }}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={value}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={spring.default}
              className="tabular"
              style={{ fontSize: 44, fontWeight: 600, lineHeight: 1 }}
            >
              {value}
              {unit ? (
                <span className="t-callout" style={{ marginLeft: 4, color: 'var(--ink-3)' }}>
                  {unit}
                </span>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.button
          onClick={inc}
          whileTap={{ scale: 0.94 }}
          transition={spring.tap}
          style={{
            width: 48, height: 48, borderRadius: 999,
            background: 'var(--accent)', color: 'var(--bg-elev)',
            display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer',
          }}
          aria-label={`Augmenter ${label}`}
        >
          <Plus size={20} />
        </motion.button>
      </div>
      {hint ? <div className="t-footnote" style={{ color: 'var(--ink-4)' }}>{hint}</div> : null}
    </div>
  );
}
