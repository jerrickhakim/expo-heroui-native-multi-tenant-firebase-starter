// app/[tenant]/[tenantId]/_layout.tsx
import config from "@/_config.json";
import LiquidGlassIcon from "@/components/ui/LiquidGlassIcon";
import { useAuthStore } from "@/stores/auth";
import { TenantProvider } from "@/stores/tenant";
import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Redirect, RelativePathString, router, useLocalSearchParams } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { Avatar } from "heroui-native";
import { Text, TouchableOpacity, View } from "react-native";

import ListItemLink from "@/components/ui/ListItemLink";
import { useHasRoleOrCapability, useTenant } from "@/stores/tenant";
const validTenants = Object.keys(config.tenants);

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user } = useAuthStore();

  const { tenant: tenantParam, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();
  const tenant = useTenant();
  const canViewUsers = useHasRoleOrCapability(["admin"], ["users.view"]);
  const links: { label: string; href: string; condition: boolean }[] = [
    {
      label: "Home",
      href: `/${tenantParam}/${tenantId}`,
      condition: true,
    },
    {
      label: "Tasks",
      href: `/${tenantParam}/${tenantId}/tasks`,
      condition: true,
    },
    {
      label: "Users",
      href: `/${tenantParam}/${tenantId}/users`,
      condition: canViewUsers,
    },
    {
      label: "Settings",
      href: `/${tenantParam}/${tenantId}/settings`,
      condition: true,
    },
  ];

  const filteredLinks = links.filter((link) => link.condition);

  return (
    <View className="flex-1 bg-background">
      <DrawerContentScrollView {...props} className="flex-1">
        {/* Default Drawer Items */}
        {/* <DrawerItemList {...props} /> */}
        {/* <Text className="text-foreground text-base">{tenant.name}</Text> */}

        <View className="flex-row items-center gap-2">
          <LiquidGlassIcon icon="arrow-left" onPress={() => router.navigate("/(tabs)")} />
          <Text className="text-foreground text-left mb-3 text-2xl font-bold">{tenant?.name}</Text>
        </View>

        <ListItemLink variant="surface">
          {filteredLinks.map((link) => (
            <ListItemLink.Item key={link.label} onPress={() => router.push(link.href as RelativePathString)}>
              <ListItemLink.Content>
                <Text className="text-foreground text-base">{link.label}</Text>
              </ListItemLink.Content>
              <ListItemLink.Indicator />
            </ListItemLink.Item>
          ))}
        </ListItemLink>
      </DrawerContentScrollView>

      {/* Avatar at bottom right */}
      <View className="absolute bottom-8 right-4">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/account?presentation=modal")}
          className="w-12 h-12 rounded-full bg-accent/10 items-center justify-center border-2 border-accent"
        >
          <Avatar alt={user?.displayName ?? ""}>
            <Avatar.Image src={user?.photoURL ?? ""} alt={user?.displayName ?? ""} />
            <Avatar.Fallback className="text-foreground">{user?.displayName?.charAt(0) ?? ""}</Avatar.Fallback>
          </Avatar>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DrawerToggleIcon() {
  const navigation = useNavigation();
  return <LiquidGlassIcon icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} styles={{ marginLeft: 16 }} />;
}

export default function TenantLayout() {
  const { tenant, tenantId } = useLocalSearchParams<{ tenant: string; tenantId: string }>();

  const tenantConfig = config.tenants[tenant as keyof typeof config.tenants];

  const canViewUsers = useHasRoleOrCapability(["admin"], ["users.add"]);

  // Redirect to 404 if tenant is not registered
  if (!validTenants.includes(tenant)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <TenantProvider key={`${tenant}/${tenantId}`} collection={tenant} tenantId={tenantId}>
      <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
        <Drawer.Screen
          name="(root)"
          options={{
            drawerLabel: "Home",
            title: tenantConfig.singular,
            headerLeft: () => <DrawerToggleIcon />,
          }}
        />

        <Drawer.Screen
          name="users"
          options={{
            headerShown: true,
            drawerLabel: "Users",
            title: "Users",
            headerLeft: () => <DrawerToggleIcon />,
            headerRight: () =>
              canViewUsers ? (
                <LiquidGlassIcon icon="plus" onPress={() => router.push(`/${tenant}/${tenantId}/users/new`)} styles={{ marginRight: 16 }} />
              ) : null,
          }}
        />

        <Drawer.Screen
          name="tasks"
          options={{
            headerShown: true,
            title: "Tasks",
            drawerItemStyle: { display: "none" },
            headerLeft: () => <DrawerToggleIcon />,
            headerRight: () => (
              <LiquidGlassIcon icon="plus" onPress={() => router.push(`/${tenant}/${tenantId}/tasks/new`)} styles={{ marginRight: 16 }} />
            ),
          }}
        />

        <Drawer.Screen
          name="settings"
          options={{
            headerShown: true,
            drawerLabel: "Settings",
            title: "Settings",
            headerLeft: () => <DrawerToggleIcon />,
          }}
        />
      </Drawer>
    </TenantProvider>
  );
}
