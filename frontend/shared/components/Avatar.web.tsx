import React from "react";

import { colors, radius } from "../tokens";
import { getInitials } from "./helpers";
import type { AvatarProps } from "./types";

export function Avatar({ name, imageUrl, size = 40, tier }: AvatarProps) {
  const initials = getInitials(name);
  const background = tier ? colors.primary[600] : colors.teal[400];
  return imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: radius.full, objectFit: "cover", border: `2px solid ${colors.white}` }}
    />
  ) : (
    <div
      aria-label={name}
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background,
        color: colors.white,
        fontWeight: 700
      }}
    >
      {initials}
    </div>
  );
}
