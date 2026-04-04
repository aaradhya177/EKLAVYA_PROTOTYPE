import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Avatar, Badge, Button, Card, EmptyState, LoadingSpinner, MetricTile, RiskIndicator, Toast } from "../components/index.web";

const meta = {
  title: "Foundation/Primitives"
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Button label="Primary" variant="primary" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Ghost" variant="ghost" />
      <Button label="Danger" variant="danger" />
      <Button label="Loading" loading />
      <Button label="Disabled" disabled />
    </div>
  )
};

export const CardsAndBadges: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      <Card variant="default">
        <Badge label="Neutral" />
      </Card>
      <Card variant="elevated">
        <Badge label="Success" variant="success" />
      </Card>
      <Card variant="outlined">
        <Badge label="Warning" variant="warning" />
      </Card>
    </div>
  )
};

export const MetricsAndRisk: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 16 }}>
      <MetricTile label="ACWR" value="1.18" trend="up" trendValue="+0.06 vs last week" />
      <RiskIndicator level="high" score={0.74} />
    </div>
  )
};

export const IdentityAndFeedback: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 20 }}>
      <Avatar name="Aarohi Sharma" tier="elite" />
      <Toast title="Sync complete" message="Performance feed updated 2 minutes ago." variant="success" />
      <LoadingSpinner />
      <EmptyState icon="📉" title="No training data yet" subtitle="Once sessions are logged, trend insights will appear here." actionLabel="Log session" />
    </div>
  )
};
