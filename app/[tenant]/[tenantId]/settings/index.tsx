import ListItemLink from "@/components/ui/ListItemLink";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Switch, useThemeColor } from "heroui-native";
import { useState } from "react";
import { ScrollView, Text } from "react-native";

export default function SettingsScreen() {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(false);
  const foregroundColor = useThemeColor("foreground");
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  return (
    <ScrollView className="flex-1 bg-background p-4">
      <ListItemLink variant="surface">
        <ListItemLink.Item onPress={() => {}}>
          <ListItemLink.Content>
            <Ionicons name="person-outline" size={20} className="text-foreground" color={foregroundColor} />
            <Text className="text-foreground text-base">Profile</Text>
          </ListItemLink.Content>
          <Switch isSelected={isNotificationsEnabled} onPress={() => setIsNotificationsEnabled(!isNotificationsEnabled)} />
        </ListItemLink.Item>

        <ListItemLink.Item onPress={() => router.push(`/${tenant}/${tenantId}/settings/name`)}>
          <ListItemLink.Content>
            <Ionicons name="person-outline" size={20} className="text-foreground" color={foregroundColor} />
            <Text className="text-foreground text-base">Name</Text>
          </ListItemLink.Content>
          <ListItemLink.Indicator />
        </ListItemLink.Item>

        <ListItemLink.Item onPress={() => {}}>
          <ListItemLink.Content>
            <Ionicons name="notifications-outline" size={20} className="text-foreground" color={foregroundColor} />
            <Text className="text-foreground text-base">Notifications</Text>
          </ListItemLink.Content>
          <ListItemLink.Indicator />
        </ListItemLink.Item>

        <ListItemLink.Item onPress={() => {}}>
          <ListItemLink.Content>
            <Ionicons name="lock-closed-outline" size={20} className="text-foreground" color={foregroundColor} />
            <Text className="text-foreground text-base">Privacy</Text>
          </ListItemLink.Content>
          <ListItemLink.Indicator />
        </ListItemLink.Item>
      </ListItemLink>
    </ScrollView>
  );
}
