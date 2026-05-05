import { AssetEditForm } from '@/app/(dashboard)/assets/_components/asset-edit-form';

export default async function EditAssetPage({
  params,
}: PageProps<'/asset/[id]/edit'>) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-10">
      <AssetEditForm assetId={id} />
    </div>
  );
}
