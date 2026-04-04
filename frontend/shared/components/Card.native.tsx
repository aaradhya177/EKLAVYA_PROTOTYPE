import React from "react";
import { Pressable, View } from "react-native";

import { colors, radius, spacing } from "../tokens";
import { nativeCardShadow } from "./helpers";
import type { CardProps } from "./types";

export function Card({ children, padding = "md", onPress, variant = "default" }: CardProps) {
  const paddingValue = spacing[padding === "sm" ? 3 : padding === "md" ? 4 : 5];
  const style = {
    backgroundColor: variant === "default" ? colors.gray[50] : colors.white,
    borderColor: colors.gray[100],
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: paddingValue,
    ...(nativeCardShadow(variant) as object)
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {children}
      </Pressable>
    );
  }

  return <View style={style}>{children}</View>;
}
