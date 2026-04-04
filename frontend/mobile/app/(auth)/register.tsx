import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { FormField } from "../../src/components/FormField";
import { LanguageSelector } from "../../src/components/LanguageSelector";
import { Screen } from "../../src/components/Screen";
import { useAuthStore } from "../../src/stores";
import { SharedComponents } from "../../src/shared";

export default function RegisterScreen() {
  const { t } = useTranslation();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState("Aarohi Sharma");
  const [email, setEmail] = useState("aarohi@athleteos.in");
  const [password, setPassword] = useState("password123");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t("errors.required")),
        email: z.string().email(t("errors.invalidEmail")),
        password: z.string().min(8, t("errors.passwordLength"))
      }),
    [t]
  );

  const onSubmit = async () => {
    const result = schema.safeParse({ name, email, password });
    if (!result.success) {
      setErrors(
        result.error.issues.reduce<Record<string, string>>((acc, issue) => {
          acc[String(issue.path[0] ?? "form")] = issue.message;
          return acc;
        }, {})
      );
      return;
    }
    setLoading(true);
    await register(name, email, password);
    setLoading(false);
    router.replace("/(app)");
  };

  return (
    <Screen>
      <View className="rounded-[24px] bg-[#534AB7] p-6">
        <Text className="text-3xl font-bold text-white">{t("auth.registerTitle")}</Text>
      </View>

      <View className="rounded-[24px] bg-white p-5" style={{ gap: 14 }}>
        <FormField label={t("auth.name")} value={name} onChangeText={setName} error={errors.name} />
        <FormField label={t("auth.email")} value={email} onChangeText={setEmail} error={errors.email} />
        <FormField label={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
        <SharedComponents.Button label={t("auth.register")} onPress={() => void onSubmit()} loading={loading} />
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm font-semibold text-[#534AB7]">{t("auth.login")}</Text>
        </Pressable>
      </View>

      <LanguageSelector />
    </Screen>
  );
}
