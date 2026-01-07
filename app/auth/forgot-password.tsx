import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { AuthError, resetPassword } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const ForgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export default function ForgotPasswordScreen() {
  const mutedColor = useThemeColor("muted");
  const { showAlert } = useAlert();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const handleResetPassword = async (values: { email: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      await resetPassword(values.email);
      await showAlert("success", "Email Sent!", "Check your inbox for password reset instructions.", "success");
      router.back();
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
          {/* Form */}
          <Formik
            initialValues={{ email: email || "" }}
            validationSchema={toFormikValidationSchema(ForgotPasswordSchema)}
            onSubmit={handleResetPassword}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, validateForm, setTouched }) => (
              <View className="gap-5">
                {/* Email Field */}
                <TextField isRequired isInvalid={!!(touched.email && errors.email)}>
                  <TextField.Label>Email</TextField.Label>
                  <TextField.Input
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="mail-outline" size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.email}</TextField.ErrorMessage>
                </TextField>

                {/* Submit Button */}
                <LoadingButton
                  label="Send Reset Link"
                  loadingLabel="Sending..."
                  isLoading={isSubmitting}
                  onPress={async () => {
                    const errors = await validateForm(values);
                    setTouched({ email: true });
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
