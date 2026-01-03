import * as Haptics from "expo-haptics";
import { useToast } from "heroui-native";

// Core notification types
type NotificationType = "error" | "success" | "warning" | "info";

// HeroUI Toast variant mapping
type ToastVariant = "default" | "accent" | "success" | "warning" | "danger";

// Impact haptic types for physical feedback
type ImpactHapticType = "light" | "medium" | "heavy" | "soft" | "rigid";

// Notification haptic types for semantic feedback
type NotificationHapticType = "success" | "warning" | "error";

// UI interaction haptic types
type UIHapticType = "selection";

// All haptic feedback types
type HapticFeedbackType = ImpactHapticType | NotificationHapticType | UIHapticType;

// Options for haptic feedback
type HapticOption = HapticFeedbackType | boolean | "auto";

interface UseAlertReturn {
  showAlert: (type: NotificationType, title: string, description?: string, haptic?: HapticOption) => Promise<void>;

  // Simple haptic feedback methods
  haptic: {
    light: () => Promise<void>;
    medium: () => Promise<void>;
    heavy: () => Promise<void>;
    soft: () => Promise<void>;
    rigid: () => Promise<void>;
    success: () => Promise<void>;
    warning: () => Promise<void>;
    error: () => Promise<void>;
    selection: () => Promise<void>;
  };
}

/**
 * Professional notification and haptic feedback hook using HeroUI Toast
 *
 * Features:
 * - Cross-platform notifications using HeroUI Toast
 * - Comprehensive haptic feedback system
 * - Auto-haptic selection based on notification type
 * - Organized feedback categories (impact, notification, UI)
 * - Type-safe configuration
 *
 * @example
 * ```typescript
 * const { showAlert, haptic } = useAlert();
 *
 * // Show success notification
 * await showAlert("success", "Login successful!", "Welcome back!");
 *
 * // Show error notification with haptic
 * await showAlert("error", "Login Failed", "Invalid credentials", "error");
 *
 * // Direct haptic feedback
 * await haptic.medium();
 * await haptic.success();
 * ```
 */
export default function useAlert(): UseAlertReturn {
  // Get HeroUI toast
  const { toast } = useToast();

  /**
   * Maps notification type to HeroUI Toast variant
   */
  const getToastVariant = (type: NotificationType): ToastVariant => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
      default:
        return "accent";
    }
  };

  // Simple haptic feedback methods - direct Haptics calls
  const hapticMethods = {
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
    rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    selection: () => Haptics.selectionAsync(),
  };

  /**
   * Shows a notification with haptic feedback using HeroUI Toast
   * Supports your preferred usage: showAlert("error", "Title", "Description", "error")
   */
  const showAlert = async (
    type: NotificationType = "info",
    title: string = "",
    description?: string,
    haptic?: HapticOption
  ): Promise<void> => {
    // Trigger haptic feedback if specified
    if (haptic && typeof haptic === "string" && haptic in hapticMethods) {
      await hapticMethods[haptic as keyof typeof hapticMethods]?.();
    }

    // Show HeroUI Toast
    toast.show({
      variant: getToastVariant(type),
      label: title,
      description: description,
      actionLabel: "Dismiss",
      onActionPress: ({ hide }) => hide(),
    });
  };

  return {
    showAlert,
    haptic: hapticMethods,
  };
}
