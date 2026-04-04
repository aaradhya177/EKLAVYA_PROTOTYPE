import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FederationAthletesPage from "@/../app/(portal)/athletes/page";
import FederationOverviewPage from "@/../app/(portal)/page";
import { useFederationStore } from "@/stores";

describe("state map click filters athlete table", () => {
  it("updates selected state and filters roster", async () => {
    const user = userEvent.setup();
    useFederationStore.setState({ selectedState: null, selectedSport: null });
    render(<FederationOverviewPage />);
    await user.click(screen.getAllByText("State")[0]);
    expect(useFederationStore.getState().selectedState).not.toBeNull();

    render(<FederationAthletesPage />);
    expect(screen.queryByText("Ira Menon")).not.toBeInTheDocument();
  });
});
