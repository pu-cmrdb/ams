'use client';

import { HomeIcon, ListTodoIcon, ShapesIcon, TagsIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import Link from 'next/link';

import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar';

import type { LucideIcon } from 'lucide-react';

interface NavGroup {
  href?: string;
  icon?: LucideIcon;
  items?: NavItem[];
  name: string;
}

interface NavItem {
  children?: NavSubItem[];
  href: string;
  icon: LucideIcon;
  name: string;
}

interface NavSubItem {
  href: string;
  name: string;
}

const routes: NavGroup[] = [
  {
    href: '/',
    icon: HomeIcon,
    name: '首頁',
  },
  {
    items: [
      {
        children: [
          {
            href: '/assets/create',
            name: '建立財產',
          },
          {
            href: '/assets/borrow',
            name: '出借單',
          },
        ],
        href: '/assets',
        icon: ShapesIcon,
        name: '財產',
      },
      {
        children: [
          {
            href: '/category/create',
            name: '建立財產類別',
          },
        ],
        href: '/category',
        icon: TagsIcon,
        name: '財產類別',
      },
      {
        children: [
          {
            href: '/inventory/create',
            name: '建立盤點計劃',
          },
        ],
        href: '/inventory',
        icon: ListTodoIcon,
        name: '盤點計劃',
      },
    ],
    name: '管理',
  },
];

export function MainSidebarContent() {
  const pathname = usePathname();

  return routes.map((group) => (
    <SidebarGroup key={group.name}>
      {group.items && <SidebarGroupLabel>{group.name}</SidebarGroupLabel>}
      <SidebarMenu>
        {group.href && group.icon
          ? (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === group.href}>
                  <Link href={group.href}>
                    <group.icon />
                    <span>{group.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          : group.items?.map((item) => (
              <NavMenuItem item={item} key={item.href} pathname={pathname} />
            ))}
      </SidebarMenu>
    </SidebarGroup>
  ));
}

function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname.startsWith(item.href);

  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.href}>
          <item.icon />
          <span>{item.name}</span>
        </Link>
      </SidebarMenuButton>
      {isActive && item.children && item.children.length > 0 && (
        <SidebarMenuSub>
          {item.children.map((sub) => (
            <SubItem item={sub} key={sub.href} pathname={pathname} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function SubItem({ item, pathname }: { item: NavSubItem; pathname: string }) {
  return (
    <SidebarMenuSubItem key={item.href}>
      <SidebarMenuSubButton asChild isActive={pathname.startsWith(item.href)}>
        <Link href={item.href}>{item.name}</Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
