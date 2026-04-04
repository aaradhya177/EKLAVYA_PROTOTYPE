import { describe, expect, it, vi } from "vitest";

import { formatCurrency, formatDate, formatDuration, formatPercentile, formatRelativeTime, getACWRStatus, getRiskColor, getRiskLabel, getSportColor, getSportIcon } from "../utils";
import { colors } from "../tokens";

describe("formatters", () => {
  it("formats currency for India", () => {
    expect(formatCurrency(123456)).toBe("₹1,23,456");
  });

  it("formats date", () => {
    expect(formatDate("2025-03-12T00:00:00Z")).toBe("12 Mar 2025");
  });

  it("formats relative time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-03-12T12:00:00Z"));
    expect(formatRelativeTime("2025-03-12T10:00:00Z")).toContain("2 hours ago");
    vi.useRealTimers();
  });

  it("formats duration", () => {
    expect(formatDuration(105)).toBe("1h 45m");
  });

  it("formats percentile", () => {
    expect(formatPercentile(0.85)).toBe("Top 15%");
  });
});

describe("risk helpers", () => {
  it("maps risk colors", () => {
    expect(getRiskColor("critical")).toBe(colors.red[400]);
  });

  it("maps risk labels", () => {
    expect(getRiskLabel(0.92)).toBe("Critical");
    expect(getRiskLabel(0.18)).toBe("Low");
  });

  it("returns acwr status", () => {
    expect(getACWRStatus(1.1).label).toBe("Optimal");
    expect(getACWRStatus(1.6).color).toBe(colors.red[400]);
  });
});

describe("sport helpers", () => {
  it("returns sport icon and color", () => {
    expect(getSportIcon("football")).toBe("⚽");
    expect(getSportColor("swimming")).toBe(colors.teal[600]);
  });
});
