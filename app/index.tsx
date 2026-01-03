import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import React from "react";
import { Linking, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// Config
import config from "@/_config.json";
export default function WelcomeScreen() {
  const backgroundColor = useThemeColor("background");

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6 py-12 w-full max-w-md mx-auto">
        {/* Background Pattern */}
        <View className="absolute inset-0 overflow-hidden">
          <View className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-accent/5" />
          <View className="absolute top-1/4 -left-20 w-60 h-60 rounded-full bg-accent/3" />
          <View className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-accent/5" />
        </View>

        <View className="flex-1 justify-between px-6 py-16">
          {/* Top Section - Logo & Branding */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)} className="items-center pt-16">
            <View className="w-24 h-24 rounded-[28px] bg-accent items-center justify-center mb-6 shadow-lg shadow-accent/30">
              <Ionicons name="flame" size={48} color={backgroundColor} />
            </View>
            <Text className="text-2xl font-bold text-foreground mt-2 text-center">{config.name}</Text>
            <Text className="text-lg text-muted mt-2 text-center">{config.description}</Text>
          </Animated.View>

          {/* Bottom Section - CTAs */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} className="gap-4">
            <Link href="/auth/signup" asChild>
              <Button size="lg" className="shadow-lg shadow-accent/20">
                <Button.Label>Get Started</Button.Label>
              </Button>
            </Link>

            <Link href="/auth/login" asChild>
              <Button size="lg" variant="secondary">
                <Button.Label>I already have an account</Button.Label>
              </Button>
            </Link>

            <Text className="text-muted text-xs text-center mt-4 leading-5">
              <Text className="text-accent" onPress={() => Linking.openURL(config.links.terms)}>
                Terms of Service
              </Text>{" "}
              <Text className="text-accent" onPress={() => Linking.openURL(config.links.privacy)}>
                Privacy Policy
              </Text>
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
