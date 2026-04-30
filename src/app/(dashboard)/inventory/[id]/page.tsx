import { use } from 'react';

import { InventoryDetailsClient } from '../_components/inventory-details-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InventoryPlanDetailsPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <div className="p-6">
      <InventoryDetailsClient id={id} />
    </div>
  );
}
