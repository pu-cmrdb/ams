'use client';

import { PlaneTakeoffIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { authClient } from '@/server/auth/client';
import { useMountEffect } from '@/hooks/use-mount-effect';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const initiateOAuth = useCallback(() =>
    void authClient.signIn.oauth2({
      callbackURL: callbackUrl,
      providerId: 'identity',
    }), [callbackUrl]);

  useMountEffect(() => {
    initiateOAuth();
  });

  return (
    <div className="grid h-dvh w-dvw place-items-center">
      <Empty>
        <EmptyMedia variant="icon">
          <PlaneTakeoffIcon />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>正在重新導向</EmptyTitle>
          <EmptyDescription>
            如果頁面沒有自動跳轉，請點擊
            <span className="cursor-pointer px-0.5 text-primary underline" onClick={initiateOAuth}>這裡</span>
            繼續
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
