import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { InventoryCreateForm } from './_components/inventory-create-form';

export default function InventoryPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>建立盤點計劃</PageTitle>
      </PageHeader>
      <InventoryCreateForm />
    </PageContainer>
  );
}
