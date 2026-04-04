import { athletes, alerts, careerGoals, coachProfile, developmentPlans, files, performanceIndices, riskScores, sessions, talentSignals, type CoachAlert, type PlanBlock } from "./mock-data";
import { validatePlanOverlap } from "./utils";

export const coachApi = {
  async login(email: string) {
    return {
      user: {
        id: coachProfile.id,
        name: coachProfile.name,
        email,
        role: "coach" as const,
        athlete_id: null,
        is_active: true
      },
      tokens: {
        access_token: "coach-access-token",
        refresh_token: "coach-refresh-token",
        token_type: "bearer" as const
      }
    };
  },
  async getOverview() {
    return {
      coach: coachProfile,
      athletes,
      alerts,
      sessions,
      riskScores,
      talentSignals,
      careerGoals
    };
  },
  async getAthletes() {
    return athletes;
  },
  async getAthleteDetail(id: string) {
    return {
      athlete: athletes.find((athlete) => athlete.id === id) ?? athletes[0],
      risk: riskScores.find((risk) => risk.athlete_id === id) ?? riskScores[0],
      sessions: sessions.filter((session) => session.athlete_id === id),
      indices: performanceIndices.filter((index) => index.athlete_id === id),
      plan: developmentPlans[id] ?? developmentPlans[athletes[0].id],
      goal: careerGoals.find((goal) => goal.athlete_id === id) ?? careerGoals[0],
      talentSignals: talentSignals.filter((signal) => signal.athlete_id === id)
    };
  },
  async getAlerts() {
    return alerts;
  },
  async acknowledgeAlerts(ids: string[]) {
    return alerts.map((alert) => (ids.includes(alert.id) ? { ...alert, reviewed: true } : alert));
  },
  async savePlan(athleteId: string, blocks: PlanBlock[]) {
    const overlaps = validatePlanOverlap(blocks);
    if (overlaps.length > 0) {
      throw new Error("Plan contains overlapping blocks");
    }
    return {
      athleteId,
      blocks
    };
  },
  async getFiles() {
    return files;
  },
  async createUploadUrl(filename: string) {
    return {
      uploadUrl: `https://example.org/upload/${filename}`,
      fileId: `upload-${filename}`
    };
  },
  async confirmUpload(fileId: string) {
    return { fileId, ok: true };
  },
  async downloadUrl(fileId: string) {
    return { fileId, downloadUrl: `https://example.org/download/${fileId}` };
  }
};
