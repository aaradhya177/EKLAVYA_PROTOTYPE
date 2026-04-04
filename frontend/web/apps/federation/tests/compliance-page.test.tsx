import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CompliancePage from "@/../app/(portal)/compliance/page";

describe("compliance page revoked consent count", () => {
  it("shows revoked consent count", () => {
    render(<CompliancePage />);
    expect(screen.getByText(/Revoked consent count:/)).toBeInTheDocument();
  });
});
