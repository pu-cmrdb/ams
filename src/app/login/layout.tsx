import { Suspense } from 'react';

export default function LoginLayout({ children }: LayoutProps<'/login'>) {
  return (
    <Suspense>
      {children}
    </Suspense>
  );
}
