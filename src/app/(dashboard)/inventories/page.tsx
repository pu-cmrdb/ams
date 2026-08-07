import { PageContainer, PageDescription, PageHeader, PageTitle } from '@/components/page';

import { InventoryListClient } from './_components/inventory-list-client';

export default function InventoryListPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>盤點計畫</PageTitle>

        <PageDescription>
          管理系統中的所有盤點計畫、檢視進度與結果。
        </PageDescription>
      </PageHeader>

      <InventoryListClient />
    </PageContainer>
  );
}
