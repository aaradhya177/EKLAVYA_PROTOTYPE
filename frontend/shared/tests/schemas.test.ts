import { describe, expect, it } from "vitest";

import { AthleteSchema, AuthTokensSchema, LoginFormSchema, NotificationSchema, RiskScoreSchema } from "../schemas";

describe("schemas", () => {
  it("accepts valid athlete payloads", () => {
    const parsed = AthleteSchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Aarohi Sharma",
      dob: "2004-08-10",
      gender: "female",
      sport_id: 2,
      state: "Haryana",
      tier: "elite",
      created_at: "2025-03-12T10:00:00Z"
    });
    expect(parsed.name).toBe("Aarohi Sharma");
  });

  it("rejects invalid risk scores", () => {
    expect(() =>
      RiskScoreSchema.parse({
        id: 1,
        athlete_id: "550e8400-e29b-41d4-a716-446655440000",
        score: 1.4,
        risk_level: "high",
        contributing_factors: [],
        computed_at: "2025-03-12T10:00:00Z",
        model_version: "v1"
      })
    ).toThrow();
  });

  it("validates auth tokens", () => {
    expect(
      AuthTokensSchema.parse({
        access_token: "access",
        refresh_token: "refresh",
        token_type: "bearer"
      }).token_type
    ).toBe("bearer");
  });

  it("rejects bad login payloads", () => {
    expect(() => LoginFormSchema.parse({ email: "not-an-email", password: "123" })).toThrow();
  });

  it("validates notifications", () => {
    const parsed = NotificationSchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440001",
      recipient_id: "550e8400-e29b-41d4-a716-446655440000",
      notification_type: "risk_alert",
      title: "High risk",
      body: "Recovery score deteriorated.",
      channel: "in_app",
      priority: "high",
      is_read: false,
      sent_at: null,
      created_at: "2025-03-12T10:00:00Z",
      metadata: {}
    });
    expect(parsed.priority).toBe("high");
  });
});
