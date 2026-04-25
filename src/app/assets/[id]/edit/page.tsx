import { AssetEditForm } from '@/app/assets/_components/asset-edit-form';

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-10">
      <AssetEditForm assetId={id} />
    </div>
  );
}
