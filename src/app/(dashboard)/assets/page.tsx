import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetListClient } from './_components/asset-list-client';

export default function AssetsPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>財產總覽</PageTitle>
      </PageHeader>

      <AssetListClient />
    </PageContainer>
  );
}
