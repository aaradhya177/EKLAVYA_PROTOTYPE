import { PDFDownloadLink, Document, Page, Text, StyleSheet } from "@react-pdf/renderer";

import {
  athletes,
  careerGoals,
  consentAudit,
  federationProfile,
  grants,
  notifications,
  performanceIndices,
  reports,
  riskScores,
  sessions,
  sports,
  talentBoard,
  talentSignals,
  type ReportJob,
  type TalentBoardTier
} from "./mock-data";
import { grantEligibilityFilter, moveTalentAthleteTier } from "./utils";

export const federationApi = {
  async login(email: string) {
    return {
      user: {
        id: federationProfile.id,
        name: federationProfile.name,
        email,
        role: "federation_admin" as const,
        athlete_id: null,
        is_active: true
      },
      tokens: {
        access_token: "federation-access-token",
        refresh_token: "federation-refresh-token",
        token_type: "bearer" as const
      }
    };
  },
  async getOverview() {
    return { federationProfile, athletes, riskScores, talentSignals, performanceIndices, sports, sessions };
  },
  async getAthletes() {
    return athletes;
  },
  async getAthleteDetail(id: string) {
    return {
      athlete: athletes.find((athlete) => athlete.id === id) ?? athletes[0],
      risk: riskScores.find((risk) => risk.athlete_id === id) ?? riskScores[0],
      performance: performanceIndices.filter((index) => index.athlete_id === id),
      sessions: sessions.filter((session) => session.athlete_id === id),
      goals: careerGoals.filter((goal) => goal.athlete_id === id),
      signals: talentSignals.filter((signal) => signal.athlete_id === id)
    };
  },
  async getTalentBoard() {
    return talentBoard;
  },
  async moveTalentAthlete(athleteId: string, tier: TalentBoardTier) {
    return moveTalentAthleteTier(talentBoard, athleteId, tier);
  },
  async getSportAnalytics() {
    return sports.map((sport) => ({
      sport,
      athleteCount: athletes.filter((athlete) => athlete.sport_id === sport.id).length
    }));
  },
  async getSportDetail(sportId: string) {
    const numericSportId = Number(sportId);
    return {
      sport: sports.find((sport) => sport.id === numericSportId) ?? sports[0],
      athletes: athletes.filter((athlete) => athlete.sport_id === numericSportId),
      sessions: sessions.filter((session) => session.sport_id === numericSportId),
      performance: performanceIndices.filter((index) => athletes.find((athlete) => athlete.id === index.athlete_id)?.sport_id === numericSportId),
      riskScores: riskScores.filter((risk) => athletes.find((athlete) => athlete.id === risk.athlete_id)?.sport_id === numericSportId)
    };
  },
  async getGrants() {
    return {
      grants,
      eligible: grantEligibilityFilter()
    };
  },
  async bulkDisburse(ids: number[]) {
    return grants.map((grant) => (ids.includes(grant.id) ? { ...grant, disbursed_at: new Date().toISOString() } : grant));
  },
  async generateReport(name: string, format: ReportJob["format"]) {
    return {
      id: `report-${Date.now()}`,
      name,
      format,
      status: "pending" as const,
      createdAt: new Date().toISOString()
    };
  },
  async pollReport(id: string) {
    return {
      id,
      name: "Generated report",
      format: "pdf" as const,
      status: "complete" as const,
      createdAt: new Date().toISOString(),
      downloadUrl: `/downloads/${id}.pdf`
    };
  },
  async getReports() {
    return reports;
  },
  async getCompliance() {
    return consentAudit;
  },
  async getNotifications() {
    return notifications;
  }
};

const styles = StyleSheet.create({
  page: { padding: 24 },
  heading: { fontSize: 18, marginBottom: 12 },
  line: { fontSize: 12, marginBottom: 6 }
});

export const SimpleReportDocument = ({ title, lines }: { title: string; lines: string[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </Page>
  </Document>
);

export { PDFDownloadLink };
