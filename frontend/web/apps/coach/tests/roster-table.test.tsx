import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RosterTable } from "@/components/roster-table";

describe("athlete roster search and filter", () => {
  it("filters rows by search and sport", async () => {
    const user = userEvent.setup();
    render(<RosterTable />);

    expect(screen.getByText("Aarohi Sharma")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search by name"), "Dev");
    expect(screen.getByText("Dev Malhotra")).toBeInTheDocument();
    expect(screen.queryByText("Aarohi Sharma")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search by name"));
    await user.selectOptions(screen.getByDisplayValue("All sports"), "Boxing");
    expect(screen.getByText("Ira Menon")).toBeInTheDocument();
    expect(screen.queryByText("Dev Malhotra")).not.toBeInTheDocument();
  });
});
