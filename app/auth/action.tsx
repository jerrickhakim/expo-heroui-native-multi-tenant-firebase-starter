import PasswordlessHandler from "@/components/auth/PasswordlessHandler";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import VerifyEmailHandler from "@/components/auth/VerifyEmailHandler";
import { Redirect, useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function Action() {
  const { oobCode, mode } = useLocalSearchParams();

  // Redirect to auth if no mode is provided
  if (!mode) {
    return <Redirect href="/auth" />;
  }

  return (
    <View className="flex-1 bg-background">
      {mode === "resetPassword" && <ResetPasswordForm oobCode={oobCode} />}
      {mode === "verifyEmail" && <VerifyEmailHandler oobCode={oobCode} />}
      {mode === "signIn" && <PasswordlessHandler oobCode={oobCode} />}
    </View>
  );
}
