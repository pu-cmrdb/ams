import { PageContainer } from '@/components/page';

import { InventoryDetailsClient } from './_components/inventory-details-client';

export default async function InventoryPlanDetailsPage({
  params,
}: PageProps<'/inventory/[id]'>) {
  const { id } = await params;

  return (
    <PageContainer>
      <InventoryDetailsClient id={id} />
    </PageContainer>
  );
}
