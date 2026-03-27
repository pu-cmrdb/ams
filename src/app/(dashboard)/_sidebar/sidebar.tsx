import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';

import { MainSidebarContent } from './main';

export function DashboardSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>

      </SidebarHeader>
      <SidebarContent>
        <MainSidebarContent />
      </SidebarContent>
      <SidebarFooter>

      </SidebarFooter>
    </Sidebar>
  );
}
