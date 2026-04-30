import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

import SuperJSON from 'superjson';

const STALE_TIME = 30_000;

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query)
          || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: STALE_TIME,
      },
    },
  });
