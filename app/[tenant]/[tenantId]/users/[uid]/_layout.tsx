import useAlert from "@/hooks/useAlert";
import { useAuth } from "@/stores/auth";
import type { TenantUserWithProfile, UserCapability, UserRole } from "@/types/tenants";
import { getRoleValues } from "@/utils/tenantConfig";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Formik } from "formik";
import { SkeletonGroup, useThemeColor } from "heroui-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

export default function EditUserLayout() {
  const { tenant, tenantId, uid } = useLocalSearchParams<{ tenant: string; tenantId: string; uid: string }>();
  const { showAlert } = useAlert();
  const { user: authUser } = useAuth();
  const mutedColor = useThemeColor("muted");

  const [userDetail, setUserDetail] = useState<TenantUserWithProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get role values from config for validation
  const roleValues = useMemo(() => getRoleValues(tenant), [tenant]);

  // Dynamic validation schema based on config
  const EditUserSchema = useMemo(
    () =>
      z.object({
        role: z.enum(roleValues as [string, ...string[]]),
        capabilities: z.array(z.string()),
      }),
    [roleValues]
  );

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const idToken = await authUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/${tenant}/${tenantId}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user");
      }

      const foundUser = data.users.find((u: TenantUserWithProfile) => u.uid === uid);
      if (!foundUser) {
        throw new Error("User not found");
      }

      setUserDetail(foundUser);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authUser, tenant, tenantId, uid]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSaveUser = async (
    values: { role: UserRole; capabilities: string[] },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      const idToken = await authUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/${tenant}/${tenantId}/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          role: values.role,
          capabilities: values.capabilities,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      // Update local state
      setUserDetail((prev) =>
        prev
          ? {
              ...prev,
              role: values.role,
              capabilities: values.capabilities as UserCapability[],
            }
          : null
      );

      await showAlert("success", "User Updated", "Role and capabilities have been updated successfully.", "success");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again.";
      await showAlert("error", "Failed to Update User", message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SkeletonGroup isLoading className="flex-1 bg-background p-6">
        <View className="items-center mb-8">
          <SkeletonGroup.Item className="h-24 w-24 rounded-full mb-4">
            <View />
          </SkeletonGroup.Item>
          <SkeletonGroup.Item className="h-6 w-40 rounded-md mb-2">
            <View />
          </SkeletonGroup.Item>
          <SkeletonGroup.Item className="h-4 w-48 rounded-md">
            <View />
          </SkeletonGroup.Item>
        </View>
      </SkeletonGroup>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-foreground text-lg font-semibold">Error</Text>
        <Text className="text-muted text-center mt-2">{error}</Text>
      </View>
    );
  }

  if (!userDetail) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-foreground text-lg font-semibold">User Not Found</Text>
        <Text className="text-muted text-center mt-2">The user you're looking for could not be found.</Text>
      </View>
    );
  }

  return (
    <Formik
      initialValues={{
        role: userDetail.role,
        capabilities: userDetail.capabilities,
        // Pass user data through formik for access in child screens
        _userDetail: userDetail,
      }}
      validationSchema={toFormikValidationSchema(EditUserSchema)}
      onSubmit={handleSaveUser}
      enableReinitialize
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
