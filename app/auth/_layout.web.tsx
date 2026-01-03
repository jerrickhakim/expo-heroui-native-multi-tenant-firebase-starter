import { Slot } from "expo-router";
import { ImageBackground, Text, View } from "react-native";

export default function AuthLayoutWeb() {
  return (
    <View className="flex-1 flex-row bg-background">
      {/* Left Panel - Background Image (hidden on mobile, visible on md+) */}
      <View className="hidden md:flex flex-1 min-h-screen">
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop" }}
          className="flex-1"
          resizeMode="cover"
        >
          {/* Gradient Overlay */}
          <View className="flex-1 bg-black/50 justify-end p-12">
            {/* Branding / Tagline */}
            <View className="max-w-lg gap-4">
              <Text className="text-white text-4xl font-bold">Welcome Back</Text>
              <Text className="text-white/80 text-lg leading-relaxed">
                Sign in to access your account and continue your journey with us.
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Right Panel - Auth Content */}
      <View className="flex-1 md:max-w-xl min-h-screen bg-background">
        <Slot />
      </View>
    </View>
  );
}
