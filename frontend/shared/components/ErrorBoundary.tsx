import React from "react";

import { colors, spacing } from "../tokens";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error): void {
    console.error("AthleteOS component error", error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: spacing[5],
            borderRadius: 16,
            background: colors.red[50],
            color: colors.red[600]
          }}
        >
          <strong>{this.props.fallbackTitle ?? "Something went wrong."}</strong>
          <p style={{ marginBottom: 0 }}>
            {this.props.fallbackMessage ?? "Try refreshing this section or come back in a moment."}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
