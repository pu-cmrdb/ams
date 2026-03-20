import { useEffect } from 'react';

import type { EffectCallback } from 'react';

export function useMountEffect(effect: EffectCallback) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
