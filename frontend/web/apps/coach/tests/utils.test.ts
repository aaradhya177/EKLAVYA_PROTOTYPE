import { describe, expect, it } from "vitest";

import { formatRosterCsv, validatePlanOverlap } from "@/lib/utils";

describe("plan overlap validation", () => {
  it("detects overlapping blocks", () => {
    const overlaps = validatePlanOverlap([
      { id: "a", blockName: "Base", startDate: "2025-03-01", endDate: "2025-03-20", focusAreas: ["speed"], volumeTarget: 5 },
      { id: "b", blockName: "Build", startDate: "2025-03-15", endDate: "2025-04-10", focusAreas: ["strength"], volumeTarget: 6 }
    ]);
    expect(overlaps).toEqual(["b"]);
  });

  it("allows non-overlapping blocks", () => {
    const overlaps = validatePlanOverlap([
      { id: "a", blockName: "Base", startDate: "2025-03-01", endDate: "2025-03-20", focusAreas: ["speed"], volumeTarget: 5 },
      { id: "b", blockName: "Build", startDate: "2025-03-21", endDate: "2025-04-10", focusAreas: ["strength"], volumeTarget: 6 }
    ]);
    expect(overlaps).toEqual([]);
  });
});

describe("csv export formatter", () => {
  it("includes expected roster headers", () => {
    const csv = formatRosterCsv();
    expect(csv).toContain("name,sport,tier,state,current_risk,acwr,last_session");
    expect(csv).toContain("Aarohi Sharma");
  });
});
