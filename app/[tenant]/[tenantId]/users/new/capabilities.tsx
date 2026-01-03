import CapabilitiesEditor from "@/components/users/CapabilitiesEditor";
import { useLocalSearchParams } from "expo-router";

export default function NewUserCapabilitiesScreen() {
  const { tenant } = useLocalSearchParams<{ tenant: string }>();
  return <CapabilitiesEditor tenant={tenant} />;
}
