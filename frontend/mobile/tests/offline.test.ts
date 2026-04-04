import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { queryKeys, syncOfflineSessions } from "../src/lib/offline";
import { useSessionStore } from "../src/stores";

describe("offline session queue", () => {
  it("syncs queued sessions and invalidates cache", async () => {
    await useSessionStore.getState().queueSession({
      id: 2,
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
    const client = new QueryClient();
    client.setQueryData(queryKeys.sessions, { sessions: [] });
    const synced = await syncOfflineSessions(client);
    expect(synced).toBeGreaterThan(0);
    expect(useSessionStore.getState().pendingOfflineSessions).toHaveLength(0);
  });
});
