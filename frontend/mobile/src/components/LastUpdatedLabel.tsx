import React from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import { formatRelativeTime } from "../shared";

type LastUpdatedLabelProps = {
  iso?: string;
};

export function LastUpdatedLabel({ iso }: LastUpdatedLabelProps) {
  const { t } = useTranslation();
  if (!iso) {
    return null;
  }
  return <Text className="text-xs text-[#5F5E5A]">{t("common.lastUpdated", { value: formatRelativeTime(iso) })}</Text>;
}
