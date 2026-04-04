import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../tokens";
import type { ButtonProps } from "./types";

const variantStyles = {
  primary: { backgroundColor: colors.primary[600], borderColor: colors.primary[600], textColor: colors.white },
  secondary: { backgroundColor: colors.white, borderColor: colors.primary[200], textColor: colors.primary[800] },
  ghost: { backgroundColor: "transparent", borderColor: "transparent", textColor: colors.gray[800] },
  danger: { backgroundColor: colors.red[400], borderColor: colors.red[400], textColor: colors.white }
} as const;

const sizeMap = {
  sm: { height: 36, horizontal: spacing[3], fontSize: typography.fontSize.sm },
  md: { height: 44, horizontal: spacing[4], fontSize: typography.fontSize.base },
  lg: { height: 52, horizontal: spacing[5], fontSize: typography.fontSize.lg }
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon
}: ButtonProps) {
  const palette = variantStyles[variant];
  const sizeStyle = sizeMap[size];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={{
        minHeight: sizeStyle.height,
        borderRadius: radius.full,
        backgroundColor: palette.backgroundColor,
        borderWidth: 1,
        borderColor: palette.borderColor,
        paddingHorizontal: sizeStyle.horizontal,
        opacity: disabled || loading ? 0.6 : 1,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
        {loading ? <ActivityIndicator color={palette.textColor} size="small" /> : icon}
        <Text
          style={{
            color: palette.textColor,
            fontFamily: typography.fontFamily.sans,
            fontWeight: typography.fontWeight.semibold,
            fontSize: sizeStyle.fontSize
          }}
        >
          {loading ? "Loading..." : label}
        </Text>
      </View>
    </Pressable>
  );
}
