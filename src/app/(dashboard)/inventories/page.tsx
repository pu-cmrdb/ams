import Link from 'next/link';

import { PageContainer, PageHeader, PageTitle } from '@/components/page';
import { buttonVariants } from '@/components/ui/button';

export default function InventoryListPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>盤點計畫總覽</PageTitle>
      </PageHeader>

      <Link className={buttonVariants()} href="/inventories/create">
        創建
      </Link>
    </PageContainer>
  );
}
