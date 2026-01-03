import config from "@/_config.json";
import { tenantKeys, TenantType, useAllTenantsLoading, useAuthStore } from "@/stores/auth";
import type { TenantData } from "@/types/tenants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button, Card, SkeletonGroup, useThemeColor } from "heroui-native";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, SectionList, Text, View } from "react-native";
import LiquidGlassIcon from "./ui/LiquidGlassIcon";

interface TenantSection {
  tenantType: TenantType;
  title: string;
  icon: string;
  data: TenantData[];
}

function TenantSkeleton() {
  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center gap-3">
        <SkeletonGroup.Item className="h-10 w-10 rounded-lg">
          <View />
        </SkeletonGroup.Item>
        <View className="flex-1 gap-2">
          <SkeletonGroup.Item className="h-4 w-40 rounded-md">
            <View />
          </SkeletonGroup.Item>
          <SkeletonGroup.Item className="h-3 w-24 rounded-md">
            <View />
          </SkeletonGroup.Item>
        </View>
      </View>
    </Card>
  );
}

interface TenantCardProps {
  tenant: TenantData;
  tenantType: TenantType;
  icon: string;
}

function TenantCard({ tenant, tenantType, icon }: TenantCardProps) {
  const mutedColor = useThemeColor("muted");
  const accentColor = useThemeColor("accent");

  const handlePress = useCallback(() => {
    router.push(`/${tenantType}/${tenant.id}`);
  }, [tenantType, tenant.id]);

  const memberCount = Object.keys(tenant.users ?? {}).length;

  return (
    <Pressable onPress={handlePress}>
      <Card className="mb-3 p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-lg bg-accent/20 items-center justify-center">
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={accentColor} />
          </View>

          <View className="flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {tenant.name}
            </Text>
            <Text className="text-sm text-muted">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={mutedColor} />
        </View>
      </Card>
    </Pressable>
  );
}

interface TenantListProps {
  onRefresh?: () => Promise<void>;
}

export default function TenantList({ onRefresh }: TenantListProps) {
  const tenants = useAuthStore((state) => state.tenants);
  const loading = useAllTenantsLoading();
  const [refreshing, setRefreshing] = useState(false);
  const mutedColor = useThemeColor("muted");

  // Build sections from tenant data
  const sections: TenantSection[] = tenantKeys.map((tenantType) => {
    const tenantConfig = config.tenants[tenantType];
    return {
      tenantType,
      title: tenantConfig.plural,
      icon: tenantConfig.icon ?? "folder-outline",
      data: tenants[tenantType] ?? [],
    };
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    // Small delay to show refresh indicator since data is realtime
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }, [onRefresh]);

  const renderItem = useCallback(
    ({ item, section }: { item: TenantData; section: TenantSection }) => (
      <TenantCard tenant={item} tenantType={section.tenantType} icon={section.icon} />
    ),
    []
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: TenantSection }) => (
      <View className="flex-row items-center gap-2 py-3 mt-2 justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name={section.icon as keyof typeof Ionicons.glyphMap} size={18} color={mutedColor} />
          <Text className="text-sm font-semibold text-muted uppercase tracking-wide">{section.title}</Text>
          <Text className="text-sm text-muted">({section.data.length})</Text>
        </View>

        <LiquidGlassIcon icon="plus" onPress={() => router.navigate(`/new/${section.tenantType}`)} styles={{ borderRadius: 100 }} />
      </View>
    ),
    [mutedColor]
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;

    // Check if all sections are empty
    const totalTenants = sections.reduce((sum, s) => sum + s.data.length, 0);
    if (totalTenants > 0) return null;

    // Build dynamic text from tenant configurations
    const tenantNames = tenantKeys.map((key) => config.tenants[key].plural.toLowerCase());
    const tenantListText =
      tenantNames.length === 1 ? tenantNames[0] : tenantNames.slice(0, -1).join(", ") + " or " + tenantNames[tenantNames.length - 1];

    // Use the first tenant type for the icon and create button
    const firstTenantType = tenantKeys[0];
    const firstTenantConfig = config.tenants[firstTenantType];

    return (
      <View className="flex-1 justify-center items-center py-12">
        <Ionicons name={firstTenantConfig.icon as keyof typeof Ionicons.glyphMap} size={48} color={mutedColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">No {firstTenantConfig.plural} Found</Text>
        <Text className="text-muted text-center mt-2 px-8">You don't have access to any {tenantListText} yet.</Text>
        <Button onPress={() => router.navigate(`/new/${firstTenantType}`)}>Create {firstTenantConfig.singular}</Button>
      </View>
    );
  }, [loading, mutedColor, sections]);

  const renderSectionFooter = useCallback(
    ({ section }: { section: TenantSection }) => {
      if (loading) {
        return (
          <View>
            {[1, 2].map((i) => (
              <TenantSkeleton key={i} />
            ))}
          </View>
        );
      }

      if (section.data.length === 0) {
        const tenantConfig = config.tenants[section.tenantType];
        return (
          <View className="py-6 items-center">
            <Text className="text-muted text-sm">No {tenantConfig.plural.toLowerCase()} yet</Text>
          </View>
        );
      }

      return null;
    },
    [loading]
  );

  return (
    <SkeletonGroup isLoading={loading} className="flex-1">
      <SectionList
        contentInsetAdjustmentBehavior="automatic"
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={renderEmpty}
        stickySectionHeadersEnabled={false}
      />
    </SkeletonGroup>
  );
}
