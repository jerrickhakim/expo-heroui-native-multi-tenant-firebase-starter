import LoadingButton from "@/components/ui/LoadingButton";
import useAlert from "@/hooks/useAlert";
import { db } from "@/integrations/firebase.client";
import { useTenant, useTenantConfig } from "@/stores/tenant";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { Formik } from "formik";
import { TextField, useThemeColor } from "heroui-native";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

const UpdateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
});

export default function UpdateNameScreen() {
  const config = useTenantConfig();
  const tenant = useTenant();

  const singular = config?.singular ?? "Tenant";
  const icon = (config?.icon ?? "business-outline") as keyof typeof Ionicons.glyphMap;

  const mutedColor = useThemeColor("muted");
  const { showAlert } = useAlert();

  // Get initial name from tenant store
  const [initialName, setInitialName] = useState("");

  useEffect(() => {
    if (tenant?.name) {
      setInitialName(tenant.name);
    }
  }, [tenant?.name]);

  const handleUpdate = async (values: { name: string }, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    if (!config?.collection || !tenant?.id) return;

    try {
      const docRef = doc(db, config.collection, tenant.id);
      await updateDoc(docRef, { name: values.name });

      await showAlert("success", "Name Updated!", `Your ${singular.toLowerCase()} name has been updated successfully.`, "success");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again";
      await showAlert("error", "Update Failed", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!config || !tenant) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-between px-6 py-12 w-full max-w-md mx-auto">
          <Formik
            initialValues={{ name: initialName }}
            validationSchema={toFormikValidationSchema(UpdateNameSchema)}
            onSubmit={handleUpdate}
            enableReinitialize
          >
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
                  label="Update Name"
                  loadingLabel="Updating..."
                  isLoading={isSubmitting}
                  isDisabled={values.name === initialName}
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
