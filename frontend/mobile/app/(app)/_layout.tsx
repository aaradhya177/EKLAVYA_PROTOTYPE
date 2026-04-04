import React from "react";
import { Redirect, Tabs } from "expo-router";

import { useAuthStore } from "../../src/stores";

export default function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) {
    return null;
  }
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#534AB7",
        tabBarInactiveTintColor: "#888780",
        tabBarStyle: {
          height: 72,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="performance" options={{ title: "Performance" }} />
      <Tabs.Screen name="injury" options={{ title: "Risk" }} />
      <Tabs.Screen name="career" options={{ title: "Career" }} />
      <Tabs.Screen name="financial" options={{ title: "Finance" }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
