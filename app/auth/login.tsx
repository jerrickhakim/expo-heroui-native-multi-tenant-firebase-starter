import useAlert from "@/hooks/useAlert";
import { AuthError, login } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Formik } from "formik";
import { Button, Spinner, TextField, useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";

import { toFormikValidate } from "zod-formik-adapter";
const LoginSchema = z.object({
  email: z.email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginScreen() {
  const mutedColor = useThemeColor("muted");
  const [showPassword, setShowPassword] = useState(false);
  const { showAlert } = useAlert();

  const handleLogin = async (
    values: { email: string; password: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      await login(values.email, values.password);
      await showAlert("success", "Welcome back!", "You have successfully signed in.", "success");
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Login Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };
  const themeColorForeground = useThemeColor("foreground");

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-12 w-full max-w-md mx-auto">
          {/* Form */}
          <Formik initialValues={{ email: "", password: "" }} validate={toFormikValidate(LoginSchema)} onSubmit={handleLogin}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
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
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
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

                {/* Forgot Password Link */}
                <View className="items-end -mt-2">
                  <Link href={`/auth/forgot-password?email=${values.email}`} asChild>
                    <Text className="text-sm text-accent font-medium">Forgot password?</Text>
                  </Link>
                </View>

                {/* Submit Button */}
                <Button
                  size="lg"
                  className="mt-4 flex-row items-center justify-center"
                  isDisabled={isSubmitting}
                  onPress={() => handleSubmit()}
                  variant="primary"
                >
                  <Button.Label>{isSubmitting ? "Signing In..." : "Sign In"}</Button.Label>
                  {isSubmitting && <Spinner color={themeColorForeground}></Spinner>}
                </Button>

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center mt-6">
                  <Text className="text-muted text-sm">Don't have an account? </Text>
                  <Link href="/auth/signup" asChild>
                    <Pressable hitSlop={8}>
                      <Text className="text-accent font-semibold text-sm">Sign up</Text>
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
