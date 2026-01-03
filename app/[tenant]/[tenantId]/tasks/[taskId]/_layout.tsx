import { Stack } from "expo-router";
import React from "react";

export default function TaskDetailLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Task Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          presentation: "modal",
          title: "Edit Task",
        }}
      />
    </Stack>
  );
}
