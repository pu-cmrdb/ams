import { AssetListClient } from './_components/asset-list-client';

export default function AssetsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">財產總覽</h1>
      <AssetListClient />
    </div>
  );
}
