import React from "react";
import renderer from "react-test-renderer";
import { describe, expect, it } from "vitest";

import { Avatar, Badge, Button, Card, EmptyState, ErrorBoundary, LoadingSpinner, MetricTile, RiskIndicator, Toast } from "../components/index.web";

describe("web component snapshots", () => {
  it("renders button variants", () => {
    const tree = renderer
      .create(
        <div>
          <Button label="Primary" variant="primary" />
          <Button label="Secondary" variant="secondary" />
          <Button label="Ghost" variant="ghost" />
          <Button label="Danger" variant="danger" />
          <Button label="Loading" loading />
          <Button label="Disabled" disabled />
        </div>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders cards and badges", () => {
    const tree = renderer
      .create(
        <div>
          <Card variant="default">Default</Card>
          <Card variant="elevated">Elevated</Card>
          <Card variant="outlined">Outlined</Card>
          <Badge label="Success" variant="success" />
          <Badge label="Warning" variant="warning" />
          <Badge label="Danger" variant="danger" />
          <Badge label="Info" variant="info" />
          <Badge label="Neutral" variant="neutral" />
        </div>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders metrics, risk, avatar, and feedback", () => {
    const tree = renderer
      .create(
        <div>
          <MetricTile label="ACWR" value="1.18" trend="up" trendValue="+0.06" />
          <RiskIndicator level="critical" score={0.91} />
          <Avatar name="Aarohi Sharma" />
          <EmptyState icon="📉" title="No data" subtitle="Add a session to get started." actionLabel="Log session" />
          <LoadingSpinner />
          <Toast title="Saved" message="Plan synced." variant="success" />
        </div>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("renders error boundary wrapper", () => {
    const boundary = renderer
      .create(
        <ErrorBoundary fallbackTitle="Oops">
          <div>Safe child</div>
        </ErrorBoundary>
      )
      .toJSON();
    expect(boundary).toMatchSnapshot();
  });
});
