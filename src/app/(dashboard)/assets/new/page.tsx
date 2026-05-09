import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetCreateForm } from './_components/asset-create-form';

export default function CreateAssetPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>建立新財產</PageTitle>
      </PageHeader>

      <AssetCreateForm />
    </PageContainer>
  );
}
