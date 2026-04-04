import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/browser";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  defaultShouldDehydrateQuery
} from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

const FIVE_MINUTES = 1000 * 60 * 5;

const exponentialDelay = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30_000);

const captureError = (error: unknown) => {
  Sentry.captureException(error);
};

export const createAthleteOSQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: FIVE_MINUTES,
        retry: 2,
        retryDelay: exponentialDelay
      },
      mutations: {
        retry: 0
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending"
      }
    },
    queryCache: new QueryCache({
      onError: captureError
    }),
    mutationCache: new MutationCache({
      onError: captureError
    })
  });

export const queryClient = createAthleteOSQueryClient();

export const createWebPersister = () =>
  typeof window === "undefined"
    ? undefined
    : createSyncStoragePersister({
        storage: window.localStorage,
        key: "athleteos-query-cache"
      });

export const createMobilePersister = () =>
  createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "athleteos-query-cache"
  });

export const setupWebQueryPersistence = (client: QueryClient = queryClient) => {
  const persister = createWebPersister();
  if (!persister) {
    return;
  }

  persistQueryClient({
    queryClient: client,
    persister,
    maxAge: FIVE_MINUTES
  });
};

export const setupMobileQueryPersistence = (client: QueryClient = queryClient) =>
  persistQueryClient({
    queryClient: client,
    persister: createMobilePersister(),
    maxAge: FIVE_MINUTES
  });
