import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { updateDisplayName } from "@/integrations/auth";
import { useAuth } from "@/stores/auth";
import { useAuthStore } from "@/stores/auth/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const UpdateDisplayNameSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50, "Display name must be less than 50 characters"),
});

export default function UpdateDisplayNameScreen() {
  const { user } = useAuth();
  const mutedColor = useThemeColor("muted");
  const { showAlert } = useAlert();

  const { refreshUser } = useAuthStore();
  const initialDisplayName = user?.displayName ?? "";

  const handleUpdate = async (values: { displayName: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      await updateDisplayName(values.displayName);
      await refreshUser();
      await showAlert("success", "Display Name Updated!", "Your display name has been updated successfully.", "success");
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
            initialValues={{ displayName: initialDisplayName }}
            validationSchema={toFormikValidationSchema(UpdateDisplayNameSchema)}
            onSubmit={handleUpdate}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, validateForm, setTouched }) => (
              <View className="flex-1 justify-between">
                {/* Display Name Field */}
                <TextField isRequired isInvalid={!!(touched.displayName && errors.displayName)}>
                  <TextField.Label>Display Name</TextField.Label>
                  <TextField.Input
                    placeholder="Enter your display name"
                    autoCapitalize="words"
                    value={values.displayName}
                    onChangeText={handleChange("displayName")}
                    onBlur={handleBlur("displayName")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="person-outline" size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.displayName}</TextField.ErrorMessage>
                </TextField>

                {/* Submit Button */}
                <LoadingButton
                  label="Update Display Name"
                  loadingLabel="Updating..."
                  isLoading={isSubmitting}
                  isDisabled={values.displayName === initialDisplayName}
                  onPress={async () => {
                    const errors = await validateForm(values);
                    setTouched({ displayName: true });
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
