import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetEditForm } from './_components/asset-edit-form';

type EditAssetPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function EditAssetPage({ params }: EditAssetPageProps) {
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
