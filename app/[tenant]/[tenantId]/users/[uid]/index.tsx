import { useAuth } from "@/stores/auth";
import { useHasRole } from "@/stores/tenant";
import type { TenantUserWithProfile, UserRole } from "@/types/tenants";
import { formatDate } from "@/utils/dateUtils";
import { formatCapabilityName, getDefaultCapabilities, getRoles } from "@/utils/tenantConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useFormikContext } from "formik";
import { Avatar, Button, Card, Spinner, useThemeColor } from "heroui-native";
import React, { useMemo } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

interface FormValues {
  role: UserRole;
  capabilities: string[];
  _userDetail: TenantUserWithProfile;
}

export default function EditUserIndexScreen() {
  const { tenant, tenantId, uid } = useLocalSearchParams<{ tenant: string; tenantId: string; uid: string }>();
  const { user: authUser } = useAuth();
  const isAdmin = useHasRole(["admin"]);
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");

  const { values, isSubmitting, handleSubmit, setFieldValue } = useFormikContext<FormValues>();

  const userDetail = values._userDetail;

  const isSelf = authUser?.uid === uid;

  // Get roles from config
  const roles = useMemo(() => getRoles(tenant), [tenant]);

  // Handle role change - update capabilities to defaults from config
  const handleRoleChange = (role: UserRole) => {
    setFieldValue("role", role);
    setFieldValue("capabilities", getDefaultCapabilities(tenant, role));
  };

  const canEdit = isAdmin && !isSelf;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 py-8 w-full max-w-md mx-auto">
          {/* Avatar & Name Section */}
          <View className="items-center mb-8">
            <View className="mb-4">
              <Avatar alt={userDetail.displayName ?? userDetail.email ?? ""} size="lg">
                <Avatar.Image source={{ uri: userDetail.photoURL ?? userDetail.avatar ?? "" }} />
                <Avatar.Fallback className="text-foreground bg-accent/20 text-2xl">
                  {(userDetail.displayName ?? userDetail.email ?? "U").charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
            </View>
            <Text className="text-2xl font-bold text-foreground">{userDetail.displayName || "No name"}</Text>
            <Text className="text-muted mt-1">{userDetail.email || "No email"}</Text>
            {isSelf && (
              <View className="mt-2 px-3 py-1 bg-accent/20 rounded-full">
                <Text className="text-xs text-accent font-medium">You</Text>
              </View>
            )}
          </View>

          {canEdit ? (
            <View className="gap-6">
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
              </View>

              {/* Edit Capabilities Button */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Capabilities</Text>
                <Pressable
                  onPress={() => router.push(`/${tenant}/${tenantId}/users/${uid}/capabilities`)}
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

              {/* Member Since */}
              <Card className="p-4">
                <Text className="text-sm font-medium text-muted mb-2">Member Since</Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={18} color={mutedColor} />
                  <Text className="text-foreground">{formatDate(userDetail.addedAt)}</Text>
                </View>
              </Card>

              {/* Submit Button */}
              <Button
                size="lg"
                className="mt-4 flex-row items-center justify-center"
                isDisabled={isSubmitting}
                onPress={() => handleSubmit()}
                variant="primary"
              >
                <Button.Label>{isSubmitting ? "Saving..." : "Save Changes"}</Button.Label>
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

              {/* Remove User Button */}
              <Button size="lg" variant="secondary" className="flex-row items-center justify-center" onPress={() => {}}>
                <Button.Label className="text-danger">Remove User</Button.Label>
              </Button>
            </View>
          ) : (
            /* View-only mode for non-admins or self */
            <View className="gap-4">
              {/* Current Role */}
              <Card className="p-4">
                <Text className="text-sm font-medium text-muted mb-3">Role</Text>
                {roles
                  .filter((r) => r.value === values.role)
                  .map((role) => (
                    <View key={role.value} className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center">
                        <Ionicons name={role.icon as keyof typeof Ionicons.glyphMap} size={20} color={accentColor} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">{role.label}</Text>
                        <Text className="text-muted text-sm">{role.description}</Text>
                      </View>
                    </View>
                  ))}
              </Card>

              {/* Capabilities */}
              <Card className="p-4">
                <Text className="text-sm font-medium text-muted mb-3">Capabilities</Text>
                <View className="flex-row flex-wrap gap-2">
                  {values.capabilities.map((cap) => (
                    <View key={cap} className="px-3 py-1.5 bg-accent/10 rounded-full">
                      <Text className="text-sm text-accent font-medium">{formatCapabilityName(cap)}</Text>
                    </View>
                  ))}
                </View>
              </Card>

              {/* Member Since */}
              <Card className="p-4">
                <Text className="text-sm font-medium text-muted mb-2">Member Since</Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar-outline" size={18} color={mutedColor} />
                  <Text className="text-foreground">{formatDate(userDetail.addedAt)}</Text>
                </View>
              </Card>

              {/* Go Back Button */}
              <Button size="lg" variant="secondary" className="mt-4" onPress={() => router.back()}>
                <Button.Label>Go Back</Button.Label>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
