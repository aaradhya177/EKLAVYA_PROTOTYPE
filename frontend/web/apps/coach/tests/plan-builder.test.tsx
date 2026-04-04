import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import PlanBuilderPage from "@/../app/(dashboard)/plans/[athleteId]/page";

describe("plan builder submit flow", () => {
  it("adds a block and submits a valid plan", async () => {
    const user = userEvent.setup();
    render(<PlanBuilderPage params={{ athleteId: "550e8400-e29b-41d4-a716-446655440000" }} />);

    await user.type(screen.getByPlaceholderText("Block name"), "Taper");
    const dateInputs = screen.getAllByDisplayValue(/2025-03-/);
    await user.clear(dateInputs[0]);
    await user.type(dateInputs[0], "2025-05-01");
    await user.clear(dateInputs[1]);
    await user.type(dateInputs[1], "2025-05-14");
    await user.click(screen.getByText("Add block"));
    await user.click(screen.getByText("Submit plan"));

    await waitFor(() => expect(screen.queryByText("Overlapping blocks highlighted in red.")).not.toBeInTheDocument());
  });
});
