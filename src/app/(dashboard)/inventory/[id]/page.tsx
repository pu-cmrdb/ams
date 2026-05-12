import { PageContainer } from '@/components/page';

import { InventoryDetailsClient } from './_components/inventory-details-client';

export default async function InventoryPlanDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer>
      <InventoryDetailsClient id={id} />
    </PageContainer>
  );
}
