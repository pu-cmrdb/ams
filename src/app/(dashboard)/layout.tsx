import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { SessionProvider } from '@/components/providers/session-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getSession } from '@/server/auth/server';

import { DashboardSidebar } from './_sidebar/sidebar';

export default async function DashboardLayout({ children }: LayoutProps<'/'>) {
  const session = await getSession();

  if (!session) {
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') ?? '/';
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <DashboardSidebar />

        <main className="w-full">
          {children}
        </main>
      </SidebarProvider>
    </SessionProvider>
  );
}
