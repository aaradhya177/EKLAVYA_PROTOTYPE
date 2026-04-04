"use client";

import { PropsWithChildren } from "react";

import { useAuthStore } from "./authStore";

export function AuthProvider({ children }: PropsWithChildren) {
  const hydrated = useAuthStore((state) => state.hydrated);
  if (!hydrated) {
    return null;
  }
  return <>{children}</>;
}
