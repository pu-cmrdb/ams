import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetEditForm } from './_components/asset-edit-form';

export default async function EditAssetPage({
  params,
}: PageProps<'/asset/[id]/edit'>) {
  const { id } = await params;

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>修改財產</PageTitle>
      </PageHeader>

      <AssetEditForm assetId={id} />
    </PageContainer>
  );
}
