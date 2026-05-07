import { HydrateClient, prefetch, trpc } from '@/trpc/server';
import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetDetail } from './_components/asset-detail';

type AssetDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function AssetDetailPage({
  params,
}: AssetDetailPageProps) {
  const { id } = await params;

  prefetch(trpc.asset.get.queryOptions({ id }));

  return (
    <HydrateClient>
      <PageContainer>
        <PageHeader>
          <PageTitle>財產詳情</PageTitle>
        </PageHeader>

        <AssetDetail assetId={id} />
      </PageContainer>
    </HydrateClient>
  );
}
