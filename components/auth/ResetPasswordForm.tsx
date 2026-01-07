import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { AuthError, confirmPasswordResetWithCode } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const ResetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

interface ResetPasswordFormProps {
  oobCode: string | string[] | undefined;
}

export default function ResetPasswordForm({ oobCode }: ResetPasswordFormProps) {
  const mutedColor = useThemeColor("muted");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showAlert } = useAlert();

  if (!oobCode || typeof oobCode !== "string") {
    return (
      <View className="flex-1 justify-center px-6 py-12 w-full max-w-md mx-auto">
        <View className="items-center gap-4">
          <Ionicons name="alert-circle-outline" size={48} color={mutedColor} />
          <Text className="text-foreground text-xl font-bold text-center">Invalid Reset Link</Text>
          <Text className="text-muted text-base text-center">This password reset link is invalid or has expired.</Text>
          <Link href="/auth/forgot-password" asChild>
            <Pressable hitSlop={8}>
              <Text className="text-accent font-semibold text-base">Request a new link</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  const handleResetPassword = async (
    values: { newPassword: string; confirmPassword: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      await confirmPasswordResetWithCode(oobCode, values.newPassword);
      await showAlert("success", "Password Reset!", "Your password has been reset and you are now signed in.", "success");
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Reset Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-12 w-full max-w-md mx-auto">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-foreground text-2xl font-bold mb-2">Reset Password</Text>
            <Text className="text-muted text-base">Enter your new password below.</Text>
          </View>

          {/* Form */}
          <Formik
            initialValues={{ newPassword: "", confirmPassword: "" }}
            validationSchema={toFormikValidationSchema(ResetPasswordSchema)}
            onSubmit={handleResetPassword}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, validateForm, setTouched }) => (
              <View className="gap-5">
                {/* New Password Field */}
                <TextField isRequired isInvalid={!!(touched.newPassword && errors.newPassword)}>
                  <TextField.Label>New Password</TextField.Label>
                  <TextField.Input
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={values.newPassword}
                    onChangeText={handleChange("newPassword")}
                    onBlur={handleBlur("newPassword")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="lock-closed-outline" size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                    <TextField.InputEndContent>
                      <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={mutedColor} />
                      </Pressable>
                    </TextField.InputEndContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.newPassword}</TextField.ErrorMessage>
                </TextField>

                {/* Confirm Password Field */}
                <TextField isRequired isInvalid={!!(touched.confirmPassword && errors.confirmPassword)}>
                  <TextField.Label>Confirm Password</TextField.Label>
                  <TextField.Input
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChangeText={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="shield-checkmark-outline" size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                    <TextField.InputEndContent>
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={8}>
                        <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={mutedColor} />
                      </Pressable>
                    </TextField.InputEndContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.confirmPassword}</TextField.ErrorMessage>
                </TextField>

                {/* Submit Button */}
                <LoadingButton
                  label="Reset Password"
                  loadingLabel="Resetting..."
                  isLoading={isSubmitting}
                  onPress={async () => {
                    const errors = await validateForm(values);
                    setTouched({ newPassword: true, confirmPassword: true });
                    if (Object.keys(errors).length === 0) {
                      handleSubmit();
                    }
                  }}
                  variant="primary"
                  size="lg"
                />

                {/* Back to Login Link */}
                <View className="flex-row justify-center items-center mt-6">
                  <Text className="text-muted text-sm">Remember your password? </Text>
                  <Link href="/auth/login" asChild>
                    <Pressable hitSlop={8}>
                      <Text className="text-accent font-semibold text-sm">Sign in</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
