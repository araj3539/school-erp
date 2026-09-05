import type { ReactNode } from "react";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { mobileTheme } from "./theme";

type Props = PressableProps & {
  label: string;
  children: ReactNode;
};

export function AccessiblePressable({ label, children, style, disabled, ...props }: Props) {
  return (
    <Pressable
      {...props}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), ...(props.accessibilityState ?? {}) }}
      disabled={disabled}
      hitSlop={props.hitSlop ?? 8}
      style={(state) => [styles.base, typeof style === "function" ? style(state) : style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: mobileTheme.touchTarget, justifyContent: "center" },
});
