import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { AuthError, signUp } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const SignUpSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export default function SignUpScreen() {
  const mutedColor = useThemeColor("muted");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showAlert } = useAlert();

  const handleSignUp = async (
    values: { email: string; password: string; confirmPassword: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      await signUp(values.email, values.password);
      await showAlert("success", "Account Created!", "You have successfully signed up.", "success");
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Sign Up Failed", message, "error");
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
            initialValues={{ email: "", password: "", confirmPassword: "" }}
            validationSchema={toFormikValidationSchema(SignUpSchema)}
            onSubmit={handleSignUp}
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

                {/* Password Field */}
                <TextField isRequired isInvalid={!!(touched.password && errors.password)}>
                  <TextField.Label>Password</TextField.Label>
                  <TextField.Input
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={values.password}
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
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
                  <TextField.ErrorMessage>{errors.password}</TextField.ErrorMessage>
                </TextField>

                {/* Confirm Password Field */}
                <TextField isRequired isInvalid={!!(touched.confirmPassword && errors.confirmPassword)}>
                  <TextField.Label>Confirm Password</TextField.Label>
                  <TextField.Input
                    placeholder="Confirm your password"
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
                  label="Create Account"
                  loadingLabel="Creating Account..."
                  isLoading={isSubmitting}
                  onPress={async () => {
                    const errors = await validateForm(values);
                    setTouched({ email: true, password: true, confirmPassword: true });
                    if (Object.keys(errors).length === 0) {
                      handleSubmit();
                    }
                  }}
                  variant="primary"
                  size="lg"
                />

                {/* Sign In Link */}
                <View className="flex-row justify-center items-center mt-6">
                  <Text className="text-muted text-sm">Already have an account? </Text>
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
