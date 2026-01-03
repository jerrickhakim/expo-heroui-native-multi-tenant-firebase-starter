import { Stack } from "expo-router";
import React from "react";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="name" options={{ headerShown: false, title: "Edit Name", presentation: "modal" }} />
    </Stack>
  );
}
