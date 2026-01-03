import { useHasCapability } from "@/stores/tenant";
import type { UserRole } from "@/types/tenants";
import { getDefaultCapabilities, getRoles } from "@/utils/tenantConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useFormikContext } from "formik";
import { Button, Spinner, TextField, useThemeColor } from "heroui-native";
import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

interface FormValues {
  email: string;
  role: UserRole;
  capabilities: string[];
}

export default function NewUserIndexScreen() {
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");

  const { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit, setFieldValue } = useFormikContext<FormValues>();

  // Check for users.add capability (config-driven)
  const canInvite = useHasCapability(["users.add"]);

  // Get roles from config
  const roles = useMemo(() => getRoles(tenant), [tenant]);

  // Handle role change - update capabilities to defaults
  const handleRoleChange = (role: UserRole) => {
    setFieldValue("role", role);
    setFieldValue("capabilities", getDefaultCapabilities(tenant, role));
  };

  // Navigate to capabilities screen
  const handleEditCapabilities = () => {
    router.push(`/${tenant}/${tenantId}/users/new/capabilities`);
  };

  if (!canInvite) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-background">
        <Ionicons name="lock-closed-outline" size={48} color={mutedColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">Access Denied</Text>
        <Text className="text-muted text-center mt-2">You don't have permission to invite users.</Text>
        <Button className="mt-6" onPress={() => router.back()}>
          <Button.Label>Go Back</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 py-8 w-full max-w-md mx-auto">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-foreground">Add User</Text>
            <Text className="text-muted mt-2">Invite someone to join your team by entering their email address.</Text>
          </View>

          <View className="gap-6">
            {/* Email Field */}
            <TextField isRequired isInvalid={!!(touched.email && errors.email)}>
              <TextField.Label>Email Address</TextField.Label>
              <TextField.Input
                placeholder="Enter their email address"
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

            {/* Role Selection */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-3">
                Role <Text className="text-danger">*</Text>
              </Text>
              <View className="gap-3">
                {roles.map((role) => {
                  const isSelected = values.role === role.value;
                  return (
                    <Pressable
                      key={role.value}
                      onPress={() => handleRoleChange(role.value as UserRole)}
                      className={`flex-row items-center p-4 rounded-xl border-2 ${
                        isSelected ? "border-accent bg-accent/10" : "border-border bg-card"
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isSelected ? "bg-accent" : "bg-muted/20"}`}
                      >
                        <Ionicons
                          name={role.icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={isSelected ? foregroundColor : mutedColor}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold ${isSelected ? "text-accent" : "text-foreground"}`}>{role.label}</Text>
                        <Text className="text-muted text-sm mt-0.5">{role.description}</Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={24} color={accentColor} />}
                    </Pressable>
                  );
                })}
              </View>
              {touched.role && errors.role && <Text className="text-danger text-sm mt-2">{errors.role}</Text>}
            </View>

            {/* Edit Capabilities Button */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Capabilities</Text>
              <Pressable
                onPress={handleEditCapabilities}
                className="flex-row items-center justify-between p-4 rounded-xl border border-border bg-card"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center">
                    <Ionicons name="key-outline" size={20} color={accentColor} />
                  </View>
                  <View>
                    <Text className="text-foreground font-medium">Edit Capabilities</Text>
                    <Text className="text-muted text-sm">
                      {values.capabilities.length} capability{values.capabilities.length !== 1 ? "ies" : "y"} enabled
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={mutedColor} />
              </Pressable>
            </View>

            {/* Info Box */}
            <View className="bg-info/10 border border-info/20 rounded-xl p-4 flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color={accentColor} className="mt-0.5" />
              <Text className="text-muted text-sm ml-3 flex-1">
                The user must have an existing account with this email address. They will get access immediately after being added.
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              size="lg"
              className="mt-4 flex-row items-center justify-center"
              isDisabled={isSubmitting}
              onPress={() => handleSubmit()}
              variant="primary"
            >
              <Button.Label>{isSubmitting ? "Adding User..." : "Add User"}</Button.Label>
              {isSubmitting && <Spinner color={foregroundColor} />}
            </Button>

            {/* Cancel Button */}
            <Button
              size="lg"
              variant="secondary"
              className="flex-row items-center justify-center"
              isDisabled={isSubmitting}
              onPress={() => router.back()}
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
