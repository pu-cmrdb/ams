import { HydrateClient, prefetch, trpc } from '@/trpc/server';
import { PageContainer, PageHeader, PageTitle } from '@/components/page';

import { AssetList } from './_components/asset-list';

export default function AssetsPage() {
  prefetch(
    trpc.asset.list.queryOptions({
      limit: 20,
    }),
  );

  return (
    <HydrateClient>
      <PageContainer>
        <PageHeader>
          <PageTitle>財產總覽</PageTitle>
        </PageHeader>

        <AssetList />
      </PageContainer>
    </HydrateClient>
  );
}
