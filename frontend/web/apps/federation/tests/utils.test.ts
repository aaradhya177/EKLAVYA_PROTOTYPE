import { describe, expect, it } from "vitest";

import { complianceSummary, countRevokedConsent, grantEligibilityFilter, moveTalentAthleteTier } from "@/lib/utils";
import { talentBoard } from "@/lib/mock-data";

describe("talent board tier promotion", () => {
  it("moves an athlete to a new tier", () => {
    const updated = moveTalentAthleteTier(talentBoard, talentBoard[0].athleteId, "Elite");
    expect(updated.find((item) => item.athleteId === talentBoard[0].athleteId)?.tier).toBe("Elite");
  });
});

describe("grant eligibility filter", () => {
  it("returns athletes who have not received a grant", () => {
    const eligible = grantEligibilityFilter();
    expect(eligible.map((athlete) => athlete.name)).toContain("Ira Menon");
  });
});

describe("compliance helpers", () => {
  it("counts revoked consents and summary buckets", () => {
    const summary = complianceSummary([
      { id: "1", athleteId: "a1", athleteName: "Athlete One", dataCategory: "health", consented: true, date: "2025-01-01", revokedDate: null },
      { id: "2", athleteId: "a1", athleteName: "Athlete One", dataCategory: "financial", consented: false, date: "2025-01-01", revokedDate: "2025-02-01" }
    ]);
    expect(summary.revokedFinancialPercent).toBeGreaterThanOrEqual(0);
    expect(countRevokedConsent([{ id: "2", athleteId: "a1", athleteName: "Athlete One", dataCategory: "financial", consented: false, date: "2025-01-01", revokedDate: "2025-02-01" }])).toBe(1);
  });
});
