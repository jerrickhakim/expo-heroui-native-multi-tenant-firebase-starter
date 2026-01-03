import CapabilitiesEditor from "@/components/users/CapabilitiesEditor";
import { useLocalSearchParams } from "expo-router";

export default function EditUserCapabilitiesScreen() {
  const { tenant } = useLocalSearchParams<{ tenant: string }>();
  return <CapabilitiesEditor tenant={tenant} />;
}
