export const SPRING = {
  gentle: { type: 'spring' as const, stiffness: 300, damping: 25 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  bouncy: { type: 'spring' as const, stiffness: 500, damping: 20 },
} as const;

export const EASE = {
  smooth: [0.25, 0.1, 0.25, 1],
  sharp: [0.4, 0, 0.2, 1],
} as const;

export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
} as const;

export const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const SLIDE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

export const SCALE = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
} as const;

export const HEIGHT = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' as const },
  exit: { opacity: 0, height: 0 },
} as const;
