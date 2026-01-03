import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Platform } from "react-native";

import { useIsAuthenticated } from "@/stores/auth";
import { Redirect } from "expo-router";
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs";
import React from "react";

export default function TabLayout() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <NativeTabs minimizeBehavior="onScrollDown" blurEffect="systemThickMaterialDark" labelVisibilityMode="unlabeled">
      <NativeTabs.Trigger name="index">
        {Platform.select({
          ios: <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />,
          android: <Icon src={<VectorIcon family={MaterialCommunityIcons} name="home" />} />,
        })}
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        {Platform.select({
          ios: <Icon src={<VectorIcon family={MaterialCommunityIcons} name="account" />} />,
          android: <Icon src={<VectorIcon family={MaterialCommunityIcons} name="account" />} />,
        })}
        <Label>Account</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
