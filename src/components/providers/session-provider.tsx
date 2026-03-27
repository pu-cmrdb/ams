'use client';

import { createContext, useContext } from 'react';

import { NO_CONTEXT } from './utils';

import type { Session } from '@/server/auth';

const SessionContext = createContext<NO_CONTEXT | Session>(NO_CONTEXT);

type SessionProviderProps = Readonly<{
  children: React.ReactNode;
  session: Session;
}>;

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);

  if (session === NO_CONTEXT) {
    throw new Error('useSession 只能在 SessionProvider 中使用');
  }

  return session;
}
