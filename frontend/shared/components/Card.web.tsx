import type { CSSProperties } from "react";
import React from "react";

import { radius, spacing } from "../tokens";
import { webCardStyles } from "./helpers";
import type { CardProps } from "./types";

export function Card({ children, padding = "md", onPress, variant = "default" }: CardProps) {
  const paddingValue = spacing[padding === "sm" ? 3 : padding === "md" ? 4 : 5];
  const style: CSSProperties = {
    ...webCardStyles(variant),
    borderRadius: radius.lg,
    padding: paddingValue
  };

  if (onPress) {
    return (
      <button type="button" onClick={onPress} style={{ ...style, width: "100%", textAlign: "left" }}>
        {children}
      </button>
    );
  }

  return <div style={style}>{children}</div>;
}
