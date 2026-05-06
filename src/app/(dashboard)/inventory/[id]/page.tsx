import { InventoryDetailsClient } from '../_components/inventory-details-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InventoryPlanDetailsPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <InventoryDetailsClient id={id} />
    </div>
  );
}
