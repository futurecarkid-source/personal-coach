import type { Insets } from './useInsets';

export type { Insets };

let cached: Insets | null = null;

/** En la web (PWA instalada en iPhone) los márgenes seguros se leen directamente de las variables CSS `env()`. */
function measure(): Insets {
  if (cached) return cached;
  if (typeof document === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 };
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);padding-right:env(safe-area-inset-right,0px)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const value = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0, right: parseFloat(cs.paddingRight) || 0 };
  document.body.removeChild(probe);
  cached = value;
  return value;
}

export function useInsets(): Insets {
  return measure();
}
