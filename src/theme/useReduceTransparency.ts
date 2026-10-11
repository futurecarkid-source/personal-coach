import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Ajuste de accesibilidad de iOS "Reducir transparencia": quien lo activa pide fondos opacos.
 * Con él, el vidrio y los desenfoques se sustituyen por superficies sólidas.
 */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => alive && setReduce(v)).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduce;
}
