import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { describe, expect, it } from "vitest";

import LoginScreen from "../app/(auth)/login";
import { changeLanguage } from "../src/lib/i18n";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuthStore } from "../src/stores";

describe("language switching", () => {
  it("updates visible strings", async () => {
    useAuthStore.setState({ user: null, hydrated: true });
    const screen = render(<AppProviders><LoginScreen /></AppProviders>);
    await changeLanguage("hi");
    await waitFor(() => expect(screen.getByText("वापसी पर स्वागत है")).toBeTruthy());
  });
});
