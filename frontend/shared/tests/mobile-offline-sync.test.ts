import { apiClient } from "../../mobile/src/lib/api";
import { useSessionStore } from "../../mobile/src/stores/sessionStore";

describe("mobile offline sync", () => {
  it("syncs queued sessions and clears local queue", async () => {
    const session = {
      id: 201,
      athlete_id: "athlete-1",
      sport_id: 1,
      session_type: "training",
      start_time: "2025-03-12T06:30:00.000Z",
      end_time: "2025-03-12T07:30:00.000Z",
      rpe: 6,
      notes: "Offline session",
      raw_metrics: {},
      computed_metrics: {},
      coach_id: null
    };

    const saveSession = vi.spyOn(apiClient, "saveSession").mockResolvedValue(session);

    await useSessionStore.getState().queueSession(session);
    expect(useSessionStore.getState().pendingOfflineSessions).toHaveLength(1);

    const synced = await useSessionStore.getState().syncPending();

    expect(synced).toBe(1);
    expect(saveSession).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().pendingOfflineSessions).toHaveLength(0);
  });
});
