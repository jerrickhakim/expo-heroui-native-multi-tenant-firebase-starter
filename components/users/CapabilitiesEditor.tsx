import type { UserRole } from "@/types/tenants";
import { formatCapabilityName, getAllCapabilities, getDefaultCapabilities } from "@/utils/tenantConfig";
import { Ionicons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import { Switch, useThemeColor } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export interface CapabilitiesFormValues {
  role: UserRole;
  capabilities: string[];
}

interface CapabilitiesEditorProps {
  tenant: string;
}

export default function CapabilitiesEditor({ tenant }: CapabilitiesEditorProps) {
  const accentColor = useThemeColor("accent");

  const { values, setFieldValue } = useFormikContext<CapabilitiesFormValues>();

  // Get all available capabilities from config
  const allCapabilities = useMemo(() => getAllCapabilities(tenant), [tenant]);

  // Get default capabilities for the current role
  const roleDefaultCapabilities = useMemo(() => getDefaultCapabilities(tenant, values.role), [tenant, values.role]);

  // Toggle individual capability
  const toggleCapability = (capability: string) => {
    const current = values.capabilities;
    const updated = current.includes(capability) ? current.filter((c) => c !== capability) : [...current, capability];
    setFieldValue("capabilities", updated);
  };

  if (allCapabilities.length === 0) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Ionicons name="key-outline" size={48} color={accentColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">No Capabilities</Text>
        <Text className="text-muted text-center mt-2">No capabilities are configured for this tenant type.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      {/* Header Info */}
      <View className="mb-6">
        <Text className="text-muted text-sm">
          Capabilities are set to defaults for the selected role ({values.role}). Toggle switches to customize permissions.
        </Text>
      </View>

      {/* Capabilities List */}
      <View className="gap-1 bg-card rounded-xl p-2 border border-border">
        {allCapabilities.map((capability) => {
          const isEnabled = values.capabilities.includes(capability);
          const isDefaultForRole = roleDefaultCapabilities.includes(capability);

          return (
            <Pressable
              key={capability}
              onPress={() => toggleCapability(capability)}
              className="flex-row items-center justify-between py-3 px-2 rounded-lg active:bg-muted/10"
            >
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-foreground font-medium">{formatCapabilityName(capability)}</Text>
                  {isDefaultForRole && (
                    <View className="px-2 py-0.5 bg-accent/20 rounded-full">
                      <Text className="text-[10px] text-accent font-medium">DEFAULT</Text>
                    </View>
                  )}
                </View>
              </View>
              <Switch isSelected={isEnabled} onSelectedChange={() => toggleCapability(capability)}>
                <Switch.Thumb />
              </Switch>
            </Pressable>
          );
        })}
      </View>

      {/* Summary */}
      <View className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
        <View className="flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={20} color={accentColor} />
          <Text className="text-foreground font-medium">
            {values.capabilities.length} capability{values.capabilities.length !== 1 ? "ies" : "y"} enabled
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
