import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AlertsPage from "@/../app/(dashboard)/alerts/page";
import * as hooks from "@/hooks/use-coach-data";

describe("real-time alert polling", () => {
  it("re-renders when new alerts arrive", async () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(hooks, "useAlertsQuery");
    spy
      .mockReturnValueOnce({
        data: [
          {
            id: "alert-1",
            athleteId: "1",
            athleteName: "Aarohi Sharma",
            riskLevel: "critical",
            score: 0.82,
            topFactor: "High load",
            time: "2025-03-12T07:10:00Z",
            reviewed: false
          }
        ]
      } as ReturnType<typeof hooks.useAlertsQuery>)
      .mockReturnValueOnce({
        data: [
          {
            id: "alert-1",
            athleteId: "1",
            athleteName: "Aarohi Sharma",
            riskLevel: "critical",
            score: 0.82,
            topFactor: "High load",
            time: "2025-03-12T07:10:00Z",
            reviewed: false
          },
          {
            id: "alert-2",
            athleteId: "2",
            athleteName: "Dev Malhotra",
            riskLevel: "high",
            score: 0.68,
            topFactor: "Sleep debt",
            time: "2025-03-12T07:12:00Z",
            reviewed: false
          }
        ]
      } as ReturnType<typeof hooks.useAlertsQuery>);

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <AlertsPage />
      </QueryClientProvider>
    );
    expect(screen.getByText("Aarohi Sharma")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <AlertsPage />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Dev Malhotra")).toBeInTheDocument());
    spy.mockRestore();
  });
});
