import LiquidGlassIcon from "@/components/ui/LiquidGlassIcon";
import { DrawerActions } from "@react-navigation/native";
import { Stack, useNavigation } from "expo-router";

function DrawerToggleIcon() {
  const navigation = useNavigation();
  return <LiquidGlassIcon icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} styles={{ marginLeft: 16 }} />;
}

export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Users", headerLeft: () => <DrawerToggleIcon />, headerRight: () => <DrawerToggleIcon /> }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: false,
          headerBackTitle: "Back",
          title: "Add User",
          presentation: "modal",
          headerLeft: () => <DrawerToggleIcon />,
          headerRight: () => <DrawerToggleIcon />,
        }}
      />

      <Stack.Screen
        name="[uid]"
        options={{
          headerShown: false,
          headerBackTitle: "Users",
          title: "User Details",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
