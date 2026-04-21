import { AssetForm } from '@/app/assets/_components/asset-form';

export default function CreateAssetPage() {
  return (
    <div className="container mx-auto py-10">
      <AssetForm mode="create" />
    </div>
  );
}
