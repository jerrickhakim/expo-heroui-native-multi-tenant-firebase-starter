import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { updateUserEmail } from "@/integrations/auth";
import { useAuth } from "@/stores/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const UpdateEmailSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export default function UpdateEmailScreen() {
  const { user } = useAuth();
  const mutedColor = useThemeColor("muted");
  const { showAlert } = useAlert();

  const initialEmail = user?.email ?? "";

  const handleUpdate = async (values: { email: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      await updateUserEmail(values.email);
      await showAlert("success", "Email Updated!", "Your email has been updated successfully.", "success");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Update Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-12 w-full max-w-md mx-auto">
          <Formik
            initialValues={{ email: initialEmail }}
            validationSchema={toFormikValidationSchema(UpdateEmailSchema)}
            onSubmit={handleUpdate}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, validateForm, setTouched }) => (
              <View className="flex-1 justify-between">
                {/* Email Field */}
                <TextField isRequired isInvalid={!!(touched.email && errors.email)}>
                  <TextField.Label>Email Address</TextField.Label>
                  <TextField.Input
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    keyboardType="email-address"
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
                  label="Update Email"
                  loadingLabel="Updating..."
                  isLoading={isSubmitting}
                  isDisabled={values.email === initialEmail}
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
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
