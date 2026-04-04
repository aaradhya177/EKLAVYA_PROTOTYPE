import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";

import {
  getNotifications,
  getUnreadCount,
  markRead
} from "../api/modules/notifications";
import type { Notification, PaginatedResponse } from "../types";

import { handleMutationError, handleMutationSuccess } from "./helpers";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (params?: Record<string, unknown>) =>
    [...notificationKeys.all, "list", params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const
};

export const useNotifications = (params?: Record<string, unknown>) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({
        ...params,
        page: pageParam
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage <= Math.ceil(lastPage.total / lastPage.per_page) ? nextPage : undefined;
    }
  });

export const useUnreadCount = () =>
  useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 1000 * 30
  });

export const useMarkRead = (params?: Record<string, unknown>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: notificationKeys.list(params)
      });

      const previousNotifications = queryClient.getQueryData<
        InfiniteData<PaginatedResponse<Notification>>
      >(notificationKeys.list(params));
      const previousUnreadCount = queryClient.getQueryData<number>(notificationKeys.unreadCount());

      queryClient.setQueryData<InfiniteData<PaginatedResponse<Notification>>>(
        notificationKeys.list(params),
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === id ? { ...item, is_read: true } : item
              )
            }))
          };
        }
      );

      queryClient.setQueryData<number>(
        notificationKeys.unreadCount(),
        (count) => Math.max((count ?? 1) - 1, 0)
      );

      return { previousNotifications, previousUnreadCount };
    },
    onSuccess: () => {
      handleMutationSuccess("Notification marked as read");
    },
    onError: (_error, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.list(params), context.previousNotifications);
      }

      if (typeof context?.previousUnreadCount === "number") {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount);
      }

      handleMutationError("Unable to update notification");
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: notificationKeys.list(params)
        }),
        queryClient.invalidateQueries({
          queryKey: notificationKeys.unreadCount()
        })
      ]);
    }
  });
};
