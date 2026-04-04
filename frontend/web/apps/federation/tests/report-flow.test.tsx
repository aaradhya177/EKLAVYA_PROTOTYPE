import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ReportsPage from "@/../app/(portal)/reports/page";

describe("report generation flow", () => {
  it("generates and lists a completed report", async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);
    await user.click(screen.getAllByText("Generate")[0]);
    await waitFor(() => expect(screen.getByText("Generated report")).toBeInTheDocument());
  });
});
