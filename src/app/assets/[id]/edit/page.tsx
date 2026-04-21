'use client';

import { useParams } from 'next/navigation';

import { AssetForm } from '@/app/assets/_components/asset-form';

export default function EditAssetPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="container mx-auto py-10">
      <AssetForm assetId={params.id} mode="edit" />
    </div>
  );
}
