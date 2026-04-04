import React from "react";
import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "../../src/stores";

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }
  if (user) {
    return <Redirect href="/(app)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
