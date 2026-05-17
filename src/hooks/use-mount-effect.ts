import { useEffect } from 'react';

import type { EffectCallback } from 'react';

export function useMountEffect(effect: EffectCallback): void {
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount effect should not depend on any props
  // biome-ignore lint/plugin: mount effect is an exception
  useEffect(effect, []);
}
