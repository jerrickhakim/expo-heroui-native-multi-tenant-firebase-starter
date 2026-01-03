import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { ActivityIndicator } from "react-native";

interface LiquidGlassIconProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  onLongPress?: () => void;
  styles?: StyleProp<ViewStyle>;
  size?: number;
  disabled?: boolean;
  loading?: boolean;
}
const LiquidGlassIcon = ({ icon, onPress, onLongPress, styles, size = 18, disabled = false, loading = false }: LiquidGlassIconProps) => {
  return (
    <GlassView
      isInteractive
      glassEffectStyle="regular"
      style={[
        {
          borderRadius: 100,
          alignSelf: "flex-start", // prevents stretching full width
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 8,
          paddingVertical: 8,
        },
        styles,
      ]}
    >
      <Pressable
        // className="ml-4 p-2"
        hitSlop={10}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress?.();
        }}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={useThemeColor("foreground")} style={{ height: size, width: size }} />
        ) : (
          <MaterialCommunityIcons name={icon} size={size} color={useThemeColor("foreground")} />
        )}
      </Pressable>
    </GlassView>
  );
};

export default LiquidGlassIcon;
