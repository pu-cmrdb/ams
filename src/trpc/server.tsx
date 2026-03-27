import 'server-only';

import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { cache } from 'react';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { headers } from 'next/headers';

import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

import { createQueryClient } from './query-client';

import type { ResolverDef, TRPCInfiniteQueryOptions, TRPCQueryOptions } from '@trpc/tanstack-react-query';

import type { AppRouter } from '@/server/api/root';

export const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  ctx: async () => createTRPCContext({ headers: await headers() }),
  queryClient: getQueryClient,
  router: appRouter,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch(
  queryOptions: ReturnType<TRPCQueryOptions<ResolverDef>>,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void queryClient.prefetchInfiniteQuery(
      queryOptions as ReturnType<TRPCInfiniteQueryOptions<ResolverDef>>,
    );
  }
  else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
