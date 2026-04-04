import React, { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";

import { queryClient as sharedQueryClient, createAthleteOSQueryClient } from "../api/queryClient";
import * as athleteApi from "../api/modules/athletes";
import * as authApi from "../api/modules/auth";
import * as careerApi from "../api/modules/career";
import * as fileApi from "../api/modules/files";
import * as financialApi from "../api/modules/financial";
import * as injuryApi from "../api/modules/injury";
import * as notificationApi from "../api/modules/notifications";
import * as performanceApi from "../api/modules/performance";
import { useAthlete } from "../hooks/athletes";
import { useCareerPlan, useCreatePlan } from "../hooks/career";
import { useFinancialSummary } from "../hooks/financial";
import { useAllAlerts, useRiskExplanation, useRiskScore } from "../hooks/injury";
import { useMarkRead, useNotifications, useUnreadCount } from "../hooks/notifications";
import { useLogSession, usePerformanceSummary, useSessions } from "../hooks/performance";
import {
  athleteFixture,
  authTokensFixture,
  authUserFixture,
  developmentPlanFixture,
  eligibleGrantFixtures,
  envelope,
  eventFixture,
  featureFixtures,
  fileFixture,
  financialSummaryFixture,
  forecastFixtures,
  goalFixtures,
  grantFixtures,
  incomeFixture,
  expenseFixture,
  injuryFixtures,
  notificationsFixture,
  performanceSummaryFixture,
  preferencesFixture,
  registerPayloadFixture,
  riskAlertsFixture,
  riskScoreFixture,
  sessionFixture,
  shapFixtures,
  talentSignalFixture,
  trendFixture
} from "../mocks/fixtures";
import { server } from "../mocks/server";
import { useAuthStore } from "../stores/authStore";
import { configureRuntimeBridge } from "../stores/runtime";

const baseUrl = "http://localhost:8000";

const createWrapper = () => {
  const client = createAthleteOSQueryClient();

  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  return { Wrapper, client };
};

describe("api modules", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: authUserFixture,
      accessToken: authTokensFixture.access_token,
      refreshToken: authTokensFixture.refresh_token,
      isAuthenticated: true,
      hydrated: true
    });
    configureRuntimeBridge({
      getLanguage: () => "hi-IN",
      redirectToLogin: vi.fn(),
      showConsentRequired: vi.fn(),
      showToast: vi.fn()
    });
  });

  afterEach(() => {
    sharedQueryClient.clear();
    useAuthStore.persist.clearStorage();
  });

  it("wraps every api module with typed responses", async () => {
    await expect(authApi.login("aarav@example.com", "password")).resolves.toEqual(authTokensFixture);
    await expect(authApi.register(registerPayloadFixture)).resolves.toEqual(authUserFixture);
    await expect(authApi.refresh(authTokensFixture.refresh_token)).resolves.toEqual(authTokensFixture);
    await expect(authApi.logout()).resolves.toBeUndefined();

    await expect(athleteApi.getAthlete("athlete-1")).resolves.toEqual(athleteFixture);
    await expect(athleteApi.updateAthlete("athlete-1", { state: "Maharashtra" })).resolves.toMatchObject({
      ...athleteFixture,
      state: "Maharashtra"
    });
    await expect(
      athleteApi.ingestEvent("athlete-1", {
        event_type: "session_logged",
        payload: { source: "mobile" },
        source: "manual"
      })
    ).resolves.toEqual(eventFixture);
    await expect(athleteApi.getFeatures("athlete-1")).resolves.toEqual(featureFixtures);

    await expect(performanceApi.logSession({ ...sessionFixture, id: undefined } as never)).resolves.toEqual(
      sessionFixture
    );
    await expect(performanceApi.getSessions("athlete-1", { page: 1 })).resolves.toMatchObject({
      items: [sessionFixture]
    });
    await expect(performanceApi.getPerformanceSummary("athlete-1")).resolves.toEqual(
      performanceSummaryFixture
    );
    await expect(
      performanceApi.getPerformanceTrend("athlete-1", "speed", "2025-03-10", "2025-03-12")
    ).resolves.toEqual(trendFixture);
    await expect(performanceApi.getPerformanceAlerts("athlete-1")).resolves.toHaveLength(1);

    await expect(injuryApi.getRiskScore("athlete-1")).resolves.toEqual(riskScoreFixture);
    await expect(injuryApi.getRiskExplanation("athlete-1")).resolves.toEqual(shapFixtures);
    await expect(injuryApi.getInjuryHistory("athlete-1")).resolves.toEqual(injuryFixtures);
    await expect(injuryApi.logInjury({ ...injuryFixtures[0], id: undefined } as never)).resolves.toEqual(
      injuryFixtures[0]
    );
    await expect(injuryApi.getAllAlerts()).resolves.toEqual(riskAlertsFixture);

    await expect(careerApi.getGoals("athlete-1")).resolves.toEqual(goalFixtures);
    await expect(
      careerApi.setGoal({
        athlete_id: "athlete-1",
        goal_type: "peak_event",
        target_date: "2025-09-01",
        priority_event: "Nationals",
        status: "active"
      })
    ).resolves.toEqual(goalFixtures[0]);
    await expect(careerApi.getPlan("athlete-1")).resolves.toEqual(developmentPlanFixture);
    await expect(
      careerApi.createPlan({
        athlete_id: "athlete-1",
        coach_id: "coach-1",
        plan_period_start: "2025-04-01",
        plan_period_end: "2025-08-30",
        goals: [{ name: "Nationals peak" }],
        periodization_blocks: developmentPlanFixture.periodization_blocks
      })
    ).resolves.toEqual(developmentPlanFixture);
    await expect(careerApi.getMilestones("athlete-1")).resolves.toEqual([
      {
        id: 1,
        athlete_id: "athlete-1",
        milestone_type: "podium",
        achieved_at: "2024-12-01",
        description: "State podium",
        verified_by: "coach-1"
      }
    ]);
    await expect(careerApi.getTalentSignal("athlete-1")).resolves.toEqual(talentSignalFixture);

    await expect(financialApi.getSummary("athlete-1", "2025-2026")).resolves.toEqual(
      financialSummaryFixture
    );
    await expect(financialApi.getForecast("athlete-1")).resolves.toEqual(forecastFixtures);
    await expect(financialApi.getGrants("athlete-1")).resolves.toEqual(grantFixtures);
    await expect(financialApi.getEligibleGrants("athlete-1")).resolves.toEqual(
      eligibleGrantFixtures
    );
    await expect(financialApi.logIncome({ ...incomeFixture, id: undefined } as never)).resolves.toEqual(
      incomeFixture
    );
    await expect(financialApi.logExpense({ ...expenseFixture, id: undefined } as never)).resolves.toEqual(
      expenseFixture
    );

    await expect(notificationApi.getNotifications({ page: 1 })).resolves.toEqual(notificationsFixture);
    await expect(notificationApi.getUnreadCount()).resolves.toEqual(1);
    await expect(notificationApi.markRead("notif-1")).resolves.toBeUndefined();
    await expect(notificationApi.markAllRead()).resolves.toBeUndefined();
    await expect(notificationApi.getPreferences()).resolves.toEqual(preferencesFixture);
    await expect(notificationApi.updatePreferences(preferencesFixture)).resolves.toEqual(
      preferencesFixture
    );
    await expect(notificationApi.registerDevice("expo-token", "android")).resolves.toBeUndefined();

    await expect(fileApi.requestUploadUrl({ athlete_id: "athlete-1" })).resolves.toEqual({
      uploadUrl: "https://upload.example.com/file",
      fileId: "file-1"
    });
    await expect(fileApi.confirmUpload("file-1")).resolves.toEqual(fileFixture);
    await expect(fileApi.getFiles("athlete-1", { page: 1 })).resolves.toEqual([fileFixture]);
    await expect(fileApi.getDownloadUrl("file-1")).resolves.toEqual(
      "https://download.example.com/file"
    );
    await expect(fileApi.deleteFile("file-1")).resolves.toBeUndefined();
  });

  it("refreshes on 401 and retries the original request", async () => {
    let athleteCalls = 0;
    server.use(
      http.get(`${baseUrl}/athletes/:id`, async () => {
        athleteCalls += 1;
        if (athleteCalls === 1) {
          return HttpResponse.json({ status: "error", data: null, message: "unauthorized" }, { status: 401 });
        }
        return HttpResponse.json(envelope(athleteFixture));
      })
    );

    const result = await athleteApi.getAthlete("athlete-1");

    expect(result).toEqual(athleteFixture);
    expect(athleteCalls).toBe(2);
    expect(useAuthStore.getState().accessToken).toBe(authTokensFixture.access_token);
  });

  it("triggers consent modal on 451 responses", async () => {
    const showConsentRequired = vi.fn();
    configureRuntimeBridge({
      showConsentRequired,
      getLanguage: () => "en-IN",
      redirectToLogin: vi.fn(),
      showToast: vi.fn()
    });

    server.use(
      http.get(`${baseUrl}/athletes/:id`, async () =>
        HttpResponse.json({ status: "error", data: null, message: "consent required" }, { status: 451 })
      )
    );

    await expect(athleteApi.getAthlete("athlete-1")).rejects.toBeTruthy();
    expect(showConsentRequired).toHaveBeenCalled();
  });

  it("persists and rehydrates auth state", async () => {
    useAuthStore.getState().login({
      user: authUserFixture,
      tokens: authTokensFixture
    });

    const persisted = await useAuthStore.persist
      .getOptions()
      .storage?.getItem("athleteos.shared.auth");
    expect(persisted).toBeTruthy();

    const snapshot = useAuthStore.getState();
    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.user?.email).toBe("aarav@example.com");
  });

  it("includes language and request id headers", async () => {
    let headers: Headers | undefined;
    server.use(
      http.get(`${baseUrl}/athletes/:id`, async ({ request }) => {
        headers = request.headers;
        return HttpResponse.json(envelope(athleteFixture));
      })
    );

    await athleteApi.getAthlete("athlete-1");

    expect(headers?.get("accept-language")).toBe("hi-IN");
    expect(headers?.get("x-request-id")).toBeTruthy();
    expect(headers?.get("authorization")).toBe(`Bearer ${authTokensFixture.access_token}`);
  });
});

describe("react query hooks", () => {
  it("loads query hooks with shared query client settings", async () => {
    const { Wrapper } = createWrapper();

    const athleteHook = renderHook(() => useAthlete("athlete-1"), { wrapper: Wrapper });
    const sessionsHook = renderHook(() => useSessions("athlete-1", { page: 1 }), { wrapper: Wrapper });
    const performanceHook = renderHook(() => usePerformanceSummary("athlete-1"), { wrapper: Wrapper });
    const riskScoreHook = renderHook(() => useRiskScore("athlete-1"), { wrapper: Wrapper });
    const riskExplanationHook = renderHook(() => useRiskExplanation("athlete-1"), { wrapper: Wrapper });
    const careerHook = renderHook(() => useCareerPlan("athlete-1"), { wrapper: Wrapper });
    const financialHook = renderHook(() => useFinancialSummary("athlete-1", "2025-2026"), {
      wrapper: Wrapper
    });
    const notificationsHook = renderHook(() => useNotifications({ page: 1 }), { wrapper: Wrapper });
    const unreadHook = renderHook(() => useUnreadCount(), { wrapper: Wrapper });
    const alertsHook = renderHook(() => useAllAlerts(), { wrapper: Wrapper });

    await waitFor(() => expect(athleteHook.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(sessionsHook.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(performanceHook.result.current.data).toEqual(performanceSummaryFixture));
    await waitFor(() => expect(riskScoreHook.result.current.data).toEqual(riskScoreFixture));
    await waitFor(() => expect(riskExplanationHook.result.current.data).toEqual(shapFixtures));
    await waitFor(() => expect(careerHook.result.current.data).toEqual(developmentPlanFixture));
    await waitFor(() => expect(financialHook.result.current.data).toEqual(financialSummaryFixture));
    await waitFor(() => expect(notificationsHook.result.current.data?.pages[0]).toEqual(notificationsFixture));
    await waitFor(() => expect(unreadHook.result.current.data).toBe(1));
    await waitFor(() => expect(alertsHook.result.current.data).toEqual(riskAlertsFixture));
  });

  it("executes mutation hooks and reports success", async () => {
    const showToast = vi.fn();
    configureRuntimeBridge({
      getLanguage: () => "en-IN",
      redirectToLogin: vi.fn(),
      showConsentRequired: vi.fn(),
      showToast
    });

    const { Wrapper } = createWrapper();

    const logSessionHook = renderHook(() => useLogSession(), { wrapper: Wrapper });
    const createPlanHook = renderHook(() => useCreatePlan(), { wrapper: Wrapper });

    await logSessionHook.result.current.mutateAsync({
      athlete_id: "athlete-1",
      sport_id: 1,
      session_type: "training",
      start_time: "2025-03-12T06:30:00.000Z",
      end_time: "2025-03-12T08:00:00.000Z",
      rpe: 7,
      notes: "Tempo block",
      raw_metrics: { distance_km: 12.4 },
      computed_metrics: { load: 84 },
      coach_id: "coach-1"
    });

    await createPlanHook.result.current.mutateAsync({
      athlete_id: "athlete-1",
      coach_id: "coach-1",
      plan_period_start: "2025-04-01",
      plan_period_end: "2025-08-30",
      goals: [{ name: "Nationals peak" }],
      periodization_blocks: developmentPlanFixture.periodization_blocks
    });

    expect(showToast).toHaveBeenCalledWith({
      title: "Session logged successfully",
      variant: "success"
    });
    expect(showToast).toHaveBeenCalledWith({
      title: "Development plan saved",
      variant: "success"
    });
  });

  it("rolls back optimistic notification updates on error", async () => {
    const { Wrapper } = createWrapper();

    const notificationsHook = renderHook(() => useNotifications({ page: 1 }), { wrapper: Wrapper });
    const unreadHook = renderHook(() => useUnreadCount(), { wrapper: Wrapper });
    const markReadHook = renderHook(() => useMarkRead({ page: 1 }), { wrapper: Wrapper });

    await waitFor(() => expect(notificationsHook.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(unreadHook.result.current.data).toBe(1));

    server.use(
      http.post(`${baseUrl}/notifications/:id/read`, async () =>
        HttpResponse.json({ status: "error", data: null, message: "failed" }, { status: 500 })
      )
    );

    markReadHook.result.current.mutate("notif-1");

    await waitFor(() => expect(markReadHook.result.current.isError).toBe(true));

    expect(
      notificationsHook.result.current.data?.pages[0].items.find((item) => item.id === "notif-1")?.is_read
    ).toBe(false);
    expect(unreadHook.result.current.data).toBe(1);
  });
});
