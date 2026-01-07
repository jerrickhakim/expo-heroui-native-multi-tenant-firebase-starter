import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { auth } from "@/integrations/firebase.client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import config from "@/_config.json";

const NewTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export default function NewTenantScreen() {
  const { tenant: tenantKey } = useLocalSearchParams<{ tenant: string }>();
  const tenant = config.tenants[tenantKey as keyof typeof config.tenants];
  const singular = tenant?.singular ?? tenantKey;
  const icon = (tenant?.icon ?? "business-outline") as keyof typeof Ionicons.glyphMap;

  const mutedColor = useThemeColor("muted");
  const { showAlert } = useAlert();

  const handleCreate = async (values: { name: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      // Get the current user's auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("You must be logged in to create a " + singular.toLowerCase());
      }

      const response = await fetch(`/api/${tenantKey}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: values.name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to create ${singular}`);
      }

      await showAlert("success", `${singular} Created!`, `Your ${singular.toLowerCase()} has been created successfully.`, "success");

      // Redirect to the new tenant
      router.replace(data.redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Creation Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-12 w-full max-w-md mx-auto">
          <Formik initialValues={{ name: "" }} validationSchema={toFormikValidationSchema(NewTenantSchema)} onSubmit={handleCreate}>
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, validateForm, setTouched }) => (
              <View className="flex-1 justify-between">
                {/* Name Field */}
                <TextField isRequired isInvalid={!!(touched.name && errors.name)}>
                  <TextField.Label>{singular} Name</TextField.Label>
                  <TextField.Input
                    placeholder={`Enter ${singular.toLowerCase()} name`}
                    autoCapitalize="words"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name={icon} size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.name}</TextField.ErrorMessage>
                </TextField>

                {/* Submit Button */}
                <LoadingButton
                  label={`Create ${singular}`}
                  loadingLabel="Creating..."
                  isLoading={isSubmitting}
                  onPress={async () => {
                    const errors = await validateForm(values);
                    setTouched({ name: true });
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
