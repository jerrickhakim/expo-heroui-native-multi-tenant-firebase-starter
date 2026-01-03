import config from "@/_config.json";
import "@/global.css";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider, useAuthStore, useIsAuthenticated } from "@/stores/auth";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "auth",
};

function AppContent() {
  const { loading } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "transparent",
        },
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="index" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="auth" options={{ presentation: "modal" }} />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="new/[tenant]"
          options={({ route }) => {
            const tenantKey = (route.params as { tenant: string }).tenant;
            const tenant = config.tenants[tenantKey as keyof typeof config.tenants];
            return {
              headerShown: true,
              headerBackTitle: "Back",
              title: `New ${tenant?.singular ?? tenantKey}`,
            };
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <View className="flex-1 bg-background">
      <AuthProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <HeroUINativeProvider>
              <AppContent />
              <StatusBar style="auto" />
            </HeroUINativeProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </AuthProvider>
    </View>
  );
}
