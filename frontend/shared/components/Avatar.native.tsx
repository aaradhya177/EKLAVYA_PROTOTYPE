import React from "react";
import { Image, Text, View } from "react-native";

import { colors, radius } from "../tokens";
import { getInitials } from "./helpers";
import type { AvatarProps } from "./types";

export function Avatar({ name, imageUrl, size = 40, tier }: AvatarProps) {
  const initials = getInitials(name);
  const background = tier ? colors.primary[600] : colors.teal[400];
  return imageUrl ? (
    <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: radius.full }} />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background
      }}
    >
      <Text style={{ color: colors.white, fontWeight: "700" }}>{initials}</Text>
    </View>
  );
}
