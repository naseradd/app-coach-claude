import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { spring } from '../../design/motion.js';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  detent?: 'medium' | 'large';
}

export function Sheet({ open, onClose, children, detent = 'medium' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const height = detent === 'large' ? '86vh' : '50vh';

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="scrim"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 100 }}
        />
      ) : null}
      {open ? (
        <motion.div
          key="sheet"
          drag="y"
          dragElastic={0.25}
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => { if (info.offset.y > 80) onClose(); }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={spring.sheet}
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, height,
            background: 'var(--bg-elev)',
            borderTopLeftRadius: 26, borderTopRightRadius: 26,
            boxShadow: 'var(--shadow-sheet)',
            zIndex: 101, paddingTop: 12,
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          <div
            style={{
              width: 40, height: 5,
              background: 'var(--ink-4)', opacity: 0.3,
              borderRadius: 999, margin: '0 auto 12px',
              flexShrink: 0,
            }}
          />
          <div style={{ padding: '0 20px', overflowY: 'auto', flex: 1 }}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
