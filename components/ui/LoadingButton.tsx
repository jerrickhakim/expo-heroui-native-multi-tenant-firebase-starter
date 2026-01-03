import { Button, Spinner, useThemeColor } from "heroui-native";
import React, { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<typeof Button>;

interface LoadingButtonProps extends Omit<ButtonProps, "children"> {
  /** The text to display on the button */
  label: string;
  /** The text to display when loading (optional, defaults to label) */
  loadingLabel?: string;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Custom spinner color (optional, defaults to theme foreground color) */
  spinnerColor?: string;
}

/**
 * A button component that displays a loading spinner and custom text during async operations.
 *
 * @example
 * ```tsx
 * <LoadingButton
 *   label="Update Display Name"
 *   loadingLabel="Updating..."
 *   isLoading={isSubmitting}
 *   onPress={handleSubmit}
 *   variant="primary"
 *   size="lg"
 * />
 * ```
 */
export default function LoadingButton({
  label,
  loadingLabel,
  isLoading = false,
  spinnerColor,
  isDisabled,
  className = "flex-row items-center justify-center",
  ...buttonProps
}: LoadingButtonProps) {
  const themeColorForeground = useThemeColor("foreground");
  const finalSpinnerColor = spinnerColor ?? themeColorForeground;

  return (
    <Button {...buttonProps} className={className} isDisabled={isDisabled || isLoading}>
      <Button.Label>{isLoading && loadingLabel ? loadingLabel : label}</Button.Label>
      {isLoading && <Spinner color={finalSpinnerColor} />}
    </Button>
  );
}
