import type { Transition } from 'motion/react';

export const spring = {
  default:  { type: 'spring', stiffness: 380, damping: 32 } as Transition,
  sheet:    { type: 'spring', stiffness: 260, damping: 28 } as Transition,
  tap:      { type: 'spring', stiffness: 600, damping: 30 } as Transition,
  knob:     { type: 'spring', stiffness: 500, damping: 32 } as Transition,
};

export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
