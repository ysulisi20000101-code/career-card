/**
 * Shared framer-motion animation helpers.
 */

export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-6%" } as const,
    transition: { delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  };
}
