import useAlert from "@/hooks/useAlert";
import { AuthError, verifyEmail } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Spinner, useThemeColor } from "heroui-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type VerificationStatus = "verifying" | "success" | "error";

interface VerifyEmailHandlerProps {
  oobCode: string | string[] | undefined;
}

export default function VerifyEmailHandler({ oobCode }: VerifyEmailHandlerProps) {
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const { showAlert } = useAlert();
  const accentColor = useThemeColor("accent");
  const successColor = useThemeColor("success");
  const dangerColor = useThemeColor("danger");
  const mutedColor = useThemeColor("muted");

  useEffect(() => {
    const handleVerifyEmail = async () => {
      if (!oobCode || typeof oobCode !== "string") {
        setStatus("error");
        return;
      }

      try {
        await verifyEmail(oobCode);
        setStatus("success");
        await showAlert("success", "Email Verified!", "Your email has been successfully verified.", "success");
      } catch (error) {
        setStatus("error");
        const message = error instanceof AuthError ? error.message : "Failed to verify email. Please try again.";
        await showAlert("error", "Verification Failed", message, "error");
      }
    };

    handleVerifyEmail();
  }, [oobCode]);

  if (status === "verifying") {
    return (
      <View className="flex-1 justify-center items-center px-6 py-12 w-full max-w-md mx-auto">
        <Spinner size="lg" color={accentColor} />
        <Text className="text-foreground text-lg font-medium mt-4">Verifying your email...</Text>
        <Text className="text-muted text-base text-center mt-2">Please wait while we verify your email address.</Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View className="flex-1 justify-center items-center px-6 py-12 w-full max-w-md mx-auto">
        <View className="items-center gap-4">
          <Ionicons name="checkmark-circle-outline" size={64} color={successColor} />
          <Text className="text-foreground text-2xl font-bold text-center">Email Verified!</Text>
          <Text className="text-muted text-base text-center">
            Your email has been successfully verified. You can now sign in to your account.
          </Text>
          <Link href="/auth/login" asChild>
            <Pressable className="mt-4" hitSlop={8}>
              <Text className="text-accent font-semibold text-base">Go to Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center px-6 py-12 w-full max-w-md mx-auto">
      <View className="items-center gap-4">
        <Ionicons name="close-circle-outline" size={64} color={dangerColor} />
        <Text className="text-foreground text-2xl font-bold text-center">Verification Failed</Text>
        <Text className="text-muted text-base text-center">
          There was an error verifying your email. The link may be invalid or expired.
        </Text>
        <Link href="/auth/login" asChild>
          <Pressable className="mt-4" hitSlop={8}>
            <Text className="text-accent font-semibold text-base">Go to Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
