import ListItemLink from "@/components/ui/ListItemLink";
import { useTenantConfig } from "@/stores/tenant";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useThemeColor } from "heroui-native";
import { ScrollView, Text } from "react-native";

export default function SettingsScreen() {
  const foregroundColor = useThemeColor("foreground");
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  const config = useTenantConfig();
  const singular = config?.singular ?? "Tenant";

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <ListItemLink variant="surface">
        <ListItemLink.Item onPress={() => router.push(`/${tenant}/${tenantId}/settings/name`)}>
          <ListItemLink.Content>
            <Ionicons name="person-outline" size={20} className="text-foreground" color={foregroundColor} />
            <Text className="text-foreground text-base">{singular} Name</Text>
          </ListItemLink.Content>
          <ListItemLink.Indicator />
        </ListItemLink.Item>
      </ListItemLink>
    </ScrollView>
  );
}
