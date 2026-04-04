import React from "react";
import renderer from "react-test-renderer";
import { describe, expect, it } from "vitest";

import CareerScreen from "../app/(app)/career/index";
import MilestonesScreen from "../app/(app)/career/milestones";
import FinancialScreen from "../app/(app)/financial/index";
import GrantsScreen from "../app/(app)/financial/grants";
import HomeScreen from "../app/(app)/index";
import InjuryScreen from "../app/(app)/injury/index";
import InjuryHistoryScreen from "../app/(app)/injury/history";
import NotificationsScreen from "../app/(app)/notifications/index";
import PerformanceScreen from "../app/(app)/performance/index";
import LogSessionScreen from "../app/(app)/performance/log-session";
import SessionDetailScreen from "../app/(app)/performance/[sessionId]";
import ProfileScreen from "../app/(app)/profile/index";
import ConsentScreen from "../app/(app)/profile/consent";
import SettingsScreen from "../app/(app)/profile/settings";
import LoginScreen from "../app/(auth)/login";
import RegisterScreen from "../app/(auth)/register";
import { AppProviders } from "../src/providers/AppProviders";
import { useAuthStore } from "../src/stores";

describe("screen snapshots", () => {
  it("renders auth screens", () => {
    useAuthStore.setState({ user: null, hydrated: true });
    const tree = renderer.create(<AppProviders><LoginScreen /></AppProviders>).toJSON();
    expect(tree).toMatchSnapshot();
    const register = renderer.create(<AppProviders><RegisterScreen /></AppProviders>).toJSON();
    expect(register).toMatchSnapshot();
  });

  it("renders app screens", () => {
    useAuthStore.setState({
      user: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Aarohi Sharma",
        email: "aarohi@athleteos.in",
        role: "athlete",
        athlete_id: "550e8400-e29b-41d4-a716-446655440000",
        is_active: true
      },
      hydrated: true
    });
    const screens = [
      HomeScreen,
      PerformanceScreen,
      SessionDetailScreen,
      LogSessionScreen,
      InjuryScreen,
      InjuryHistoryScreen,
      CareerScreen,
      MilestonesScreen,
      FinancialScreen,
      GrantsScreen,
      NotificationsScreen,
      ProfileScreen,
      SettingsScreen,
      ConsentScreen
    ];
    for (const ScreenComponent of screens) {
      const tree = renderer.create(<AppProviders><ScreenComponent /></AppProviders>).toJSON();
      expect(tree).toMatchSnapshot();
    }
  });
});
