import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface Props {
  children: ReactNode;
  routeKey: string;
}

/**
 * Cross-fade + 8px y-shift wrapper for page transitions.
 * Used inside AppShell <AnimatePresence mode="wait">.
 */
export function PageTransition({ children, routeKey }: Props) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{ minHeight: '100dvh' }}
    >
      {children}
    </motion.div>
  );
}
