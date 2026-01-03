import { useThemeColor } from "heroui-native";
import React, { Children, createContext, forwardRef, useCallback, useContext, useMemo } from "react";
import { Pressable, StyleSheet, View, type GestureResponderEvent, type PressableProps, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Types
type ListItemLinkVariant = "default" | "surface";

interface ListItemLinkContextValue {
  variant: ListItemLinkVariant;
}

interface ListItemLinkRootProps extends ViewProps {
  children?: React.ReactNode;
  variant?: ListItemLinkVariant;
  isDividerVisible?: boolean;
}

interface ListItemLinkItemProps extends Omit<PressableProps, "children"> {
  children?: React.ReactNode;
  isDisabled?: boolean;
  disableAnimation?: boolean;
}

interface ListItemLinkContentProps extends ViewProps {
  children?: React.ReactNode;
}

interface ListItemLinkIndicatorProps extends ViewProps {
  children?: React.ReactNode;
  iconSize?: number;
  iconColor?: string;
  isVisible?: boolean;
}

// Context
const ListItemLinkContext = createContext<ListItemLinkContextValue | null>(null);

function useListItemLinkContext() {
  const context = useContext(ListItemLinkContext);
  if (!context) {
    throw new Error("ListItemLink components must be used within ListItemLink.Root");
  }
  return context;
}

// Chevron Icon
function ChevronRightIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path
        fillRule="evenodd"
        d="M8.205 4.455a1.125 1.125 0 0 1 1.59 0l6.75 6.75a1.125 1.125 0 0 1 0 1.59l-6.75 6.75a1.125 1.125 0 1 1-1.59-1.59L14.16 12 8.205 6.045a1.125 1.125 0 0 1 0-1.59"
        clipRule="evenodd"
      />
    </Svg>
  );
}

// Root Component
const Root = forwardRef<View, ListItemLinkRootProps>((props, ref) => {
  const { children, variant = "default", isDividerVisible = true, className, style, ...restProps } = props;

  const contextValue = useMemo(() => ({ variant }), [variant]);

  const containerClassName =
    variant === "surface"
      ? `flex-col overflow-hidden bg-surface border border-surface rounded-3xl ${className ?? ""}`
      : `flex-col overflow-hidden ${className ?? ""}`;

  const dividerClassName = variant === "surface" ? "h-hairline bg-divider/75 mx-3" : "h-hairline bg-divider";

  return (
    <ListItemLinkContext.Provider value={contextValue}>
      <View ref={ref} className={containerClassName} style={[styles.root, style]} {...restProps}>
        {Children.map(children, (child, index) => (
          <>
            {child}
            {isDividerVisible && index < Children.count(children) - 1 && <View className={dividerClassName} />}
          </>
        ))}
      </View>
    </ListItemLinkContext.Provider>
  );
});

// Item Component
const Item = forwardRef<View, ListItemLinkItemProps>((props, ref) => {
  const { children, isDisabled = false, disableAnimation = false, style, onPressIn, onPressOut, ...restProps } = props;
  const { variant } = useListItemLinkContext();

  const isPressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    if (disableAnimation) return {};
    return {
      transform: [{ scale: withSpring(isPressed.value ? 0.985 : 1, { damping: 15, stiffness: 300, mass: 0.5 }) }],
    };
  }, [disableAnimation]);

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      isPressed.value = true;
      onPressIn?.(event);
    },
    [isPressed, onPressIn]
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      isPressed.value = false;
      onPressOut?.(event);
    },
    [isPressed, onPressOut]
  );

  const itemClassName =
    variant === "surface"
      ? `flex-row items-center justify-between py-4 px-5 gap-4 bg-transparent ${isDisabled ? "opacity-50" : ""}`
      : `flex-row items-center justify-between py-4 px-3 gap-4 bg-transparent ${isDisabled ? "opacity-50" : ""}`;

  return (
    <AnimatedPressable
      ref={ref}
      disabled={isDisabled}
      className={itemClassName}
      style={[animatedStyle, styles.root, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...restProps}
    >
      {children}
    </AnimatedPressable>
  );
});

// Content Component
const Content = forwardRef<View, ListItemLinkContentProps>((props, ref) => {
  const { children, className, ...restProps } = props;

  return (
    <View ref={ref} className={`flex-1 flex-row items-center gap-3 ${className ?? ""}`} {...restProps}>
      {children}
    </View>
  );
});

// Indicator Component
const Indicator = forwardRef<View, ListItemLinkIndicatorProps>((props, ref) => {
  const { children, iconSize = 16, iconColor, isVisible = true, className, style, ...restProps } = props;

  const themeColorMuted = useThemeColor("muted");
  const finalColor = iconColor ?? themeColorMuted;

  if (!isVisible) return null;

  return (
    <View ref={ref} className={`items-center justify-center ${className ?? ""}`} style={style} {...restProps}>
      {children ?? <ChevronRightIcon size={iconSize} color={finalColor} />}
    </View>
  );
});

// Styles
const styles = StyleSheet.create({
  root: {
    borderCurve: "continuous",
  },
});

// Display Names
Root.displayName = "ListItemLink";
Item.displayName = "ListItemLink.Item";
Content.displayName = "ListItemLink.Content";
Indicator.displayName = "ListItemLink.Indicator";

/**
 * A compound component for creating navigable list items with optional dividers and indicators.
 *
 * @example
 * ```tsx
 * <ListItemLink variant="surface">
 *   <ListItemLink.Item onPress={() => router.push('/profile')}>
 *     <ListItemLink.Content>
 *       <Text>Profile Settings</Text>
 *     </ListItemLink.Content>
 *     <ListItemLink.Indicator />
 *   </ListItemLink.Item>
 *   <ListItemLink.Item onPress={() => router.push('/notifications')}>
 *     <ListItemLink.Content>
 *       <Text>Notifications</Text>
 *     </ListItemLink.Content>
 *     <ListItemLink.Indicator />
 *   </ListItemLink.Item>
 * </ListItemLink>
 * ```
 */
const ListItemLink = Object.assign(Root, {
  Item,
  Content,
  Indicator,
});

export default ListItemLink;
export { useListItemLinkContext };
export type { ListItemLinkContentProps, ListItemLinkIndicatorProps, ListItemLinkItemProps, ListItemLinkRootProps, ListItemLinkVariant };
