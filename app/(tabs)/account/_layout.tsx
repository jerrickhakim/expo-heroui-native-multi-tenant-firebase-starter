import { Stack } from "expo-router";
import React from "react";

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen
        name="display-name"
        options={{
          headerShown: false,
          title: "Display Name",
          presentation: "modal",
        }}
      />
      <Stack.Screen name="email" options={{ headerShown: false, title: "Update Email", presentation: "modal" }} />
    </Stack>
  );
}
