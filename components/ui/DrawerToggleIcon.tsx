import { DrawerActions, useNavigation } from "@react-navigation/native";
import { StyleProp, ViewStyle } from "react-native";
import LiquidGlassIcon from "./LiquidGlassIcon";

export default function DrawerToggleIcon({ styles }: { styles?: StyleProp<ViewStyle> }) {
  const navigation = useNavigation();
  return <LiquidGlassIcon icon="menu" onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} styles={styles} />;
}
