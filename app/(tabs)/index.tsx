import TenantList from "@/components/TenantList";
import { View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <TenantList />
    </View>
  );
}
