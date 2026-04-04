import "../lib/i18n";
import "../../global.css";

import React, { PropsWithChildren, useEffect } from "react";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { InAppToast } from "../components/InAppToast";
import { syncOfflineSessions } from "../lib/offline";
import { asyncStoragePersister, queryClient } from "../lib/queryClient";
import { bindNotificationNavigation, registerPushToken } from "../lib/notifications";
import { useNetworkStore } from "../lib/network";
import { useSessionStore } from "../stores";

export function AppProviders({ children }: PropsWithChildren) {
  const refreshNetwork = useNetworkStore((state) => state.refresh);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const hydrateQueue = useSessionStore((state) => state.hydrateQueue);
  const [toastMessage, setToastMessage] = React.useState("");

  useEffect(() => {
    void refreshNetwork();
    void hydrateQueue();
    void registerPushToken();
    const subscription = bindNotificationNavigation();
    const foreground = Notifications.addNotificationReceivedListener((notification) => {
      setToastMessage(String(notification.request.content.title ?? notification.request.content.body ?? ""));
      setTimeout(() => setToastMessage(""), 2500);
    });
    return () => {
      subscription.remove();
      foreground.remove();
    };
  }, [hydrateQueue, refreshNetwork]);

  useEffect(() => {
    if (isOnline) {
      void syncOfflineSessions(queryClient);
    }
  }, [isOnline]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
          {children}
          <InAppToast visible={Boolean(toastMessage)} message={toastMessage} />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
