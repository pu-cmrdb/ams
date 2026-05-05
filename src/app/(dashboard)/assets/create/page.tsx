import { PageContainer, PageHeader, PageTitle } from '@/components/page';
import { AssetCreateForm } from '@/app/(dashboard)/assets/create/_components/asset-create-form';

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
