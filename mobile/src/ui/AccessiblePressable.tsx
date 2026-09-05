import { Pressable, StyleSheet, type PressableProps } from "react-native";
import { mobileTheme } from "./theme";

type Props = PressableProps & {
  label: string;
};

export function AccessiblePressable({ label, children, style, disabled, accessibilityState, ...props }: Props) {
  return (
    <Pressable
      {...props}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ ...(accessibilityState ?? {}), disabled: Boolean(disabled) }}
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
