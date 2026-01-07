import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { AuthError, checkIsSignInWithEmailLink, signInWithMagicLink } from "@/integrations/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import { Spinner, TextField, useThemeColor } from "heroui-native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const EMAIL_STORAGE_KEY = "passwordless_email";

const EmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

interface PasswordlessHandlerProps {
  oobCode: string | string[] | undefined;
}

export default function PasswordlessHandler({ oobCode }: PasswordlessHandlerProps) {
  const params = useLocalSearchParams();
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  // Construct the full URL from params
  useEffect(() => {
    const urlParams = new URLSearchParams(params as Record<string, string>).toString();
    const constructedUrl = `${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}/auth/action?${urlParams}`;
    setUrl(constructedUrl);
  }, [params]);

  // Load stored email
  useEffect(() => {
    const loadEmail = async () => {
      try {
        const email = await AsyncStorage.getItem(EMAIL_STORAGE_KEY);
        setStoredEmail(email);
      } catch (error) {
        console.error("Failed to load email:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEmail();
  }, []);

  // Auto sign-in if email is stored
  useEffect(() => {
    const attemptSignIn = async () => {
      if (!storedEmail || !url || !checkIsSignInWithEmailLink(url)) {
        return;
      }

      setLoading(true);
      try {
        await signInWithMagicLink(storedEmail, url);
        await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
        await showAlert("success", "Welcome!", "You have successfully signed in.", "success");
        router.replace("/(tabs)");
      } catch (error) {
        const message = error instanceof AuthError ? error.message : "An error occurred. Please try again";
        await showAlert("error", "Sign In Failed", message, "error");
        setStoredEmail(null);
        await AsyncStorage.removeItem(EMAIL_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    attemptSignIn();
  }, [storedEmail, url]);

  const handleEmailSubmit = async (values: { email: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      await signInWithMagicLink(values.email, url);
      await AsyncStorage.setItem(EMAIL_STORAGE_KEY, values.email);
      await showAlert("success", "Welcome!", "You have successfully signed in.", "success");
      router.replace("/(tabs)");
    } catch (error) {
      const message = error instanceof AuthError ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Sign In Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center px-6 py-12 w-full max-w-md mx-auto">
        <Spinner size="lg" color={accentColor} />
        <Text className="text-foreground text-lg font-medium mt-4">Signing you in...</Text>
        <Text className="text-muted text-base text-center mt-2">Please wait while we verify your sign-in link.</Text>
      </View>
    );
  }

  // If no stored email, show email input form
  if (!storedEmail) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-center px-6 py-12 w-full max-w-md mx-auto">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-foreground text-2xl font-bold mb-2">Confirm Your Email</Text>
              <Text className="text-muted text-base">Please enter the email address you used to request this sign-in link.</Text>
            </View>

            {/* Form */}
            <Formik initialValues={{ email: "" }} validationSchema={toFormikValidationSchema(EmailSchema)} onSubmit={handleEmailSubmit}>
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
                    label="Sign In"
                    loadingLabel="Signing In..."
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
                    <Text className="text-muted text-sm">Changed your mind? </Text>
                    <Link href="/auth/login" asChild>
                      <Pressable hitSlop={8}>
                        <Text className="text-accent font-semibold text-sm">Back to Sign In</Text>
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

  return null;
}
