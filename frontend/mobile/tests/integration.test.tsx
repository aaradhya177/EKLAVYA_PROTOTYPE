import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { describe, expect, it } from "vitest";

import HomeScreen from "../app/(app)/index";
import LoginScreen from "../app/(auth)/login";
import LogSessionScreen from "../app/(app)/performance/log-session";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuthStore, useSessionStore } from "../src/stores";

describe("login to dashboard to log session flow", () => {
  it("authenticates and queues session updates", async () => {
    useAuthStore.setState({ user: null, tokens: null, hydrated: true });
    const login = render(<AppProviders><LoginScreen /></AppProviders>);
    fireEvent.press(login.getByText("Sign in"));
    await waitFor(() => expect(useAuthStore.getState().user?.name).toBe("Aarohi Sharma"));

    render(<AppProviders><HomeScreen /></AppProviders>);
    const sessionScreen = render(<AppProviders><LogSessionScreen /></AppProviders>);
    fireEvent.press(sessionScreen.getByText("Submit"));
    await waitFor(() => expect(useSessionStore.getState().pendingOfflineSessions.length).toBeGreaterThanOrEqual(0));
  });
});
