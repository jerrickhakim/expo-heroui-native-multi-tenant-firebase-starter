import { useAuth } from "@/stores/auth";
import { useTenant } from "@/stores/tenant";
import type { TenantUserWithProfile } from "@/types/tenants";
import { getRole } from "@/utils/tenantConfig";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Avatar, Card, SkeletonGroup, useThemeColor } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

// Role color mapping (can be extended in config if needed)
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-danger/20 text-danger",
  teamMember: "bg-accent/20 text-accent",
  viewer: "bg-muted/20 text-muted",
};

function UserSkeleton() {
  return (
    <Card className="mb-3 p-4">
      <View className="flex-row items-center gap-3">
        <SkeletonGroup.Item className="h-12 w-12 rounded-full">
          <View />
        </SkeletonGroup.Item>
        <View className="flex-1 gap-2">
          <SkeletonGroup.Item className="h-4 w-32 rounded-md">
            <View />
          </SkeletonGroup.Item>
          <SkeletonGroup.Item className="h-3 w-48 rounded-md">
            <View />
          </SkeletonGroup.Item>
        </View>
        <SkeletonGroup.Item className="h-6 w-20 rounded-full">
          <View />
        </SkeletonGroup.Item>
      </View>
    </Card>
  );
}

interface UserCardProps {
  user: TenantUserWithProfile;
  tenantType: string;
  onPress: () => void;
}

function UserCard({ user, tenantType, onPress }: UserCardProps) {
  const mutedColor = useThemeColor("muted");

  // Get role info from config
  const roleConfig = getRole(tenantType, user.role);
  const roleLabel = roleConfig?.label || user.role;
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.viewer;

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3 p-4">
        <View className="flex-row items-center gap-3">
          <Avatar alt={user.displayName ?? user.email ?? ""}>
            <Avatar.Image source={{ uri: user.photoURL ?? user.avatar ?? "" }} />
            <Avatar.Fallback className="text-foreground bg-accent/20">
              {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>

          <View className="flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {user.displayName || "No name"}
            </Text>
            <Text className="text-sm text-muted" numberOfLines={1}>
              {user.email || "No email"}
            </Text>
          </View>

          <View className={`px-3 py-1 rounded-full ${roleColor.split(" ")[0]}`}>
            <Text className={`text-xs font-medium ${roleColor.split(" ")[1]}`}>{roleLabel}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={mutedColor} />
        </View>
      </Card>
    </Pressable>
  );
}

export default function TenantUsersScreen() {
  const { tenant: tenantParam, tenantId, refresh } = useLocalSearchParams<{ tenant: string; tenantId: string; refresh?: string }>();
  const { user } = useAuth();
  const [users, setUsers] = useState<TenantUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutedColor = useThemeColor("muted");
  const tenant = useTenant();
  const fetchUsers = useCallback(async () => {
    try {
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/${tenantParam}/${tenantId}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      setUsers(data.users);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, tenantParam, tenantId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Refetch users when refresh param is present (e.g., after creating a new user)
  useEffect(() => {
    if (refresh === "true") {
      fetchUsers();
      // Clear the refresh param from URL to avoid refetching on subsequent renders
      router.setParams({ refresh: undefined });
    }
  }, [refresh, fetchUsers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleUserPress = useCallback(
    (uid: string) => {
      router.push(`/${tenantParam}/${tenantId}/users/${uid}`);
    },
    [tenantParam, tenantId]
  );

  const renderUser = useCallback(
    ({ item }: { item: TenantUserWithProfile }) => (
      <UserCard user={item} tenantType={tenantParam} onPress={() => handleUserPress(item.uid)} />
    ),
    [handleUserPress, tenantParam]
  );

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View className="flex-1 justify-center items-center py-12">
        <Ionicons name="people-outline" size={48} color={mutedColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">No Users Found</Text>
        <Text className="text-muted text-center mt-2 px-8">There are no users in this team yet. Add a user to get started.</Text>
      </View>
    );
  }, [loading, mutedColor]);

  if (error && !loading) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-background">
        <Ionicons name="alert-circle-outline" size={48} color={mutedColor} />
        <Text className="text-foreground text-lg font-semibold mt-4">Error Loading Users</Text>
        <Text className="text-muted text-center mt-2">{error}</Text>
        <Pressable onPress={fetchUsers} className="mt-6 px-6 py-3 bg-accent rounded-xl">
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SkeletonGroup isLoading={loading} className="flex-1">
        <FlatList
          data={loading ? [] : users}
          keyExtractor={(item) => item.uid}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            loading ? (
              <View>
                {Array.from({ length: Object.keys(tenant?.users ?? {}).length || 5 }).map((_, i) => (
                  <UserSkeleton key={i} />
                ))}
              </View>
            ) : (
              renderEmpty()
            )
          }
        />
      </SkeletonGroup>
    </View>
  );
}
