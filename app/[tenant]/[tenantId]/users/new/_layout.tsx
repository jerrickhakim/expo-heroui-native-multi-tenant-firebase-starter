import useAlert from "@/hooks/useAlert";
import { useAuth } from "@/stores/auth";
import type { UserRole } from "@/types/tenants";
import { getDefaultCapabilities, getDefaultRole, getRoleValues } from "@/utils/tenantConfig";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import React, { useMemo } from "react";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

export default function NewUserLayout() {
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  // Get role values from config for validation
  const roleValues = useMemo(() => getRoleValues(tenant), [tenant]);
  const defaultRole = useMemo(() => getDefaultRole(tenant), [tenant]);
  const defaultCapabilities = useMemo(() => getDefaultCapabilities(tenant, defaultRole), [tenant, defaultRole]);

  // Dynamic validation schema based on config
  const AddUserSchema = useMemo(
    () =>
      z.object({
        email: z.string().email("Please enter a valid email address"),
        role: z.enum(roleValues as [string, ...string[]]),
        capabilities: z.array(z.string()),
      }),
    [roleValues]
  );

  const handleAddUser = async (
    values: { email: string; role: UserRole; capabilities: string[] },
    { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
  ) => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/${tenant}/${tenantId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: values.email,
          role: values.role,
          capabilities: values.capabilities,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add user");
      }

      await showAlert("success", "User Added", `${values.email} has been added successfully.`, "success");
      resetForm();
      router.replace(`/${tenant}/${tenantId}/users?refresh=true`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again.";
      await showAlert("error", "Failed to Add User", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        email: "",
        role: defaultRole,
        capabilities: defaultCapabilities,
      }}
      validationSchema={toFormikValidationSchema(AddUserSchema)}
      onSubmit={handleAddUser}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="capabilities"
          options={{
            presentation: "modal",
            headerShown: true,
            headerBackTitle: "Back",
            title: "Edit Capabilities",
          }}
        />
      </Stack>
    </Formik>
  );
}
