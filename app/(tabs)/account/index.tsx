import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Switch, useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import config from "@/_config.json";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { logout } from "@/integrations/auth";
import { useAuthStore } from "@/stores/auth/store";

import ListItemLink from "@/components/ui/ListItemLink";

const tenantKeys = Object.keys(config.tenants) as Array<keyof typeof config.tenants>;

export default function AccountScreen() {
  const { user } = useAuthStore();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  const foregroundColor = useThemeColor("foreground");

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
      {/* Background decoration */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent/5" />
        <View className="absolute top-1/3 -left-10 w-40 h-40 rounded-full bg-accent/3" />
      </View>

      <View className="flex-1 px-6 pt-16">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="mb-4">
            <ProfileAvatar size={96} editable />
          </View>
          <Text className="text-2xl font-bold text-foreground">{user?.displayName || "Account"}</Text>
          {user?.email && <Text className="text-muted text-sm mt-1">{user.email}</Text>}
        </View>

        <View className="h-full flex justify-between">
          {/* Profile Settings */}
          <ListItemLink variant="surface">
            <ListItemLink.Item onPress={() => router.push("/(tabs)/account/display-name")}>
              <ListItemLink.Content>
                <Ionicons name="person-outline" size={20} className="text-foreground" color={foregroundColor} />
                <Text className="text-foreground text-base">Display Name</Text>
              </ListItemLink.Content>
              <ListItemLink.Indicator />
            </ListItemLink.Item>

            <ListItemLink.Item onPress={() => router.push("/(tabs)/account/email")}>
              <ListItemLink.Content>
                <Ionicons name="mail-outline" size={20} className="text-foreground" color={foregroundColor} />
                <Text className="text-foreground text-base">Update Email</Text>
              </ListItemLink.Content>
              <ListItemLink.Indicator />
            </ListItemLink.Item>

            <ListItemLink.Item onPress={() => {}}>
              <ListItemLink.Content>
                <Ionicons name="notifications-outline" size={20} className="text-foreground" color={foregroundColor} />
                <Text className="text-foreground text-base">Enable Notifications</Text>
              </ListItemLink.Content>
              <Switch isSelected={isNotificationsEnabled} onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)} />
            </ListItemLink.Item>
          </ListItemLink>

          {/* Tenant Actions */}
          {/* {tenantKeys.length > 0 && (
            <View className="mt-6">
              <ListItemLink variant="surface">
                {tenantKeys.map((key) => {
                  const tenant = config.tenants[key];
                  const icon = (tenant.icon ?? "add-circle-outline") as keyof typeof Ionicons.glyphMap;

                  return (
                    <ListItemLink.Item key={key} onPress={() => router.push(`/new/${key}`)}>
                      <ListItemLink.Content>
                        <Ionicons name={icon} size={20} className="text-foreground" color={foregroundColor} />
                        <Text className="text-foreground text-base">New {tenant.singular}</Text>
                      </ListItemLink.Content>
                      <ListItemLink.Indicator />
                    </ListItemLink.Item>
                  );
                })}
              </ListItemLink>
            </View>
          )} */}

          {/* Logout Section */}

          <ListItemLink variant="surface">
            <ListItemLink.Item onPress={handleLogout}>
              <ListItemLink.Content>
                <MaterialCommunityIcons name="run" size={24} color={foregroundColor} />
                <Text className="text-foreground text-lg font-bold">Logout</Text>
              </ListItemLink.Content>
              <ListItemLink.Indicator />
            </ListItemLink.Item>
          </ListItemLink>
        </View>
      </View>
    </ScrollView>
  );
}
