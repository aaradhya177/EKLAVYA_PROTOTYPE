import * as LocalAuthentication from "expo-local-authentication";
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

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("aarohi@athleteos.in");
  const [password, setPassword] = useState("password123");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotVisible, setForgotVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("errors.invalidEmail")),
        password: z.string().min(8, t("errors.passwordLength"))
      }),
    [t]
  );

  const onSubmit = async () => {
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      setErrors(
        result.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const key = String(issue.path[0] ?? "form");
          acc[key] = issue.message;
          return acc;
        }, {})
      );
      return;
    }
    setLoading(true);
    setErrors({});
    await login(email, password);
    setLoading(false);
    router.replace("/(app)");
  };

  const onBiometric = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    if (!available) {
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t("auth.biometric")
    });
    if (result.success) {
      await onSubmit();
    }
  };

  return (
    <Screen>
      <View className="rounded-[24px] bg-[#26215C] p-6">
        <Text className="text-3xl font-bold text-white">{t("auth.loginTitle")}</Text>
        <Text className="mt-2 text-sm text-[#CECBF6]">{t("common.appName")}</Text>
      </View>

      <View className="rounded-[24px] bg-white p-5" style={{ gap: 14 }}>
        <FormField label={t("auth.email")} value={email} onChangeText={setEmail} error={errors.email} />
        <FormField label={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
        <SharedComponents.Button label={t("auth.login")} onPress={() => void onSubmit()} loading={loading} />
        <SharedComponents.Button label={t("auth.biometric")} variant="secondary" onPress={() => void onBiometric()} />
        <Pressable onPress={() => setForgotVisible((value) => !value)}>
          <Text className="text-sm font-semibold text-[#534AB7]">{t("auth.forgotPassword")}</Text>
        </Pressable>
        {forgotVisible ? <Text className="text-xs text-[#5F5E5A]">{t("auth.otpStub")}</Text> : null}
        <Pressable onPress={() => router.push("/(auth)/register")}>
          <Text className="text-sm text-[#444441]">{t("auth.registerTitle")}</Text>
        </Pressable>
      </View>

      <LanguageSelector />
    </Screen>
  );
}
