'use client';

import { createContext, useContext, useMemo, useState } from 'react';

import { useMountEffect } from '@/hooks/use-mount-effect';

import { NO_CONTEXT } from './utils';

export type Platform =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'android'
  | 'ios'
  | 'unknown';

const platformRegex: [RegExp, Platform][] = [
  [/Android/, 'android'],
  [/iPhone|iPad|iPod/, 'ios'],
  [/Windows NT/, 'windows'],
  [/Mac OS X/, 'macos'],
  [/Linux/, 'linux'],
];

export class PlatformInfo {
  constructor(readonly ua: string) {}

  get platform(): Platform {
    return platformRegex.find(([re]) => re.test(this.ua))?.[1] ?? 'unknown';
  }

  get isWindows() {
    return this.platform === 'windows';
  }

  get isMacOS() {
    return this.platform === 'macos';
  }

  get isLinux() {
    return this.platform === 'linux';
  }

  get isAndroid() {
    return this.platform === 'android';
  }

  get isIOS() {
    return this.platform === 'ios';
  }

  get isMobile() {
    return this.isAndroid || this.isIOS;
  }

  get isDesktop() {
    return this.isWindows || this.isMacOS || this.isLinux;
  }

  get ctrlKey() {
    switch (this.platform) {
      case 'windows':
      case 'linux':
        return 'Ctrl';

      case 'macos':
        return 'Meta';

      default:
        return null;
    }
  }

  get ctrl() {
    switch (this.platform) {
      case 'windows':
      case 'linux':
        return 'Ctrl';

      case 'macos':
        return '⌘';

      default:
        return null;
    }
  }

  get alt() {
    switch (this.platform) {
      case 'windows':
      case 'linux':
        return 'Alt';

      case 'macos':
        return '⌥';

      default:
        return null;
    }
  }

  get shift() {
    switch (this.platform) {
      case 'windows':
      case 'linux':
        return 'Shift';

      case 'macos':
        return '⇧';

      default:
        return null;
    }
  }
}

const PlatformContext = createContext<NO_CONTEXT | PlatformInfo>(NO_CONTEXT);

type PlatformProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function PlatformProvider({ children }: PlatformProviderProps) {
  const [ua, setUa] = useState('');

  useMountEffect(() => {
    setUa(navigator.userAgent);
  });

  const info = useMemo(() => new PlatformInfo(ua), [ua]);

  return (
    <PlatformContext.Provider value={info}>{children}</PlatformContext.Provider>
  );
}

export function usePlatform(): PlatformInfo {
  const info = useContext(PlatformContext);

  if (info === NO_CONTEXT) {
    throw new Error('usePlatform 只能在 PlatformProvider 中使用');
  }

  return info;
}
