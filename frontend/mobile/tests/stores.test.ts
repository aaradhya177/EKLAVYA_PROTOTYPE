import { describe, expect, it } from "vitest";

import { useAthleteStore, useAuthStore, useNotificationStore, useSessionStore } from "../src/stores";

describe("stores", () => {
  it("logs in and refreshes tokens", async () => {
    const session = await useAuthStore.getState().login("aarohi@athleteos.in", "password123");
    expect(session.user.name).toBe("Aarohi Sharma");
    const refreshed = await useAuthStore.getState().refreshToken();
    expect(refreshed?.access_token).toContain("refreshed");
  });

  it("sets athlete profile and sport", () => {
    useAthleteStore.getState().setProfile({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Aarohi Sharma",
      dob: "2004-08-10",
      gender: "female",
      sport_id: 1,
      state: "Haryana",
      tier: "elite",
      created_at: "2025-01-01T00:00:00Z"
    });
    useAthleteStore.getState().setSport({
      id: 1,
      name: "Athletics",
      category: "individual",
      ontology_tags: {}
    });
    expect(useAthleteStore.getState().sport?.name).toBe("Athletics");
  });

  it("queues and marks notifications", async () => {
    useNotificationStore.getState().setNotifications([
      {
        id: "550e8400-e29b-41d4-a716-446655440111",
        recipient_id: "550e8400-e29b-41d4-a716-446655440000",
        notification_type: "INJURY_RISK_CRITICAL",
        title: "Risk spike detected",
        body: "Recovery score dipped.",
        channel: "in_app",
        priority: "critical",
        is_read: false,
        sent_at: "2025-03-12T07:10:00Z",
        created_at: "2025-03-12T07:10:00Z",
        metadata: {}
      }
    ]);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    useNotificationStore.getState().markRead("550e8400-e29b-41d4-a716-446655440111");
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    await useSessionStore.getState().queueSession({
      id: 1,
      athlete_id: "550e8400-e29b-41d4-a716-446655440000",
      sport_id: 1,
      session_type: "training",
      start_time: "2025-03-12T06:00:00Z",
      end_time: "2025-03-12T07:00:00Z",
      rpe: 7,
      notes: "",
      raw_metrics: {},
      computed_metrics: {},
      coach_id: null
    });
    expect(useSessionStore.getState().pendingOfflineSessions).toHaveLength(1);
  });
});
