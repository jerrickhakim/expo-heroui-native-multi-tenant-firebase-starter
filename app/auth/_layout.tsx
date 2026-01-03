import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: true,
          presentation: "card",
          headerTitle: "Login",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          headerShown: true,
          presentation: "card",
          headerTitle: "Sign Up",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          presentation: "card",
          headerTitle: "Forgot Password",
        }}
      />
      <Stack.Screen name="action" options={{ headerShown: false, presentation: "card" }} />
    </Stack>
  );
}
