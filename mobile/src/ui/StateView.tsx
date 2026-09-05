import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AccessiblePressable } from "./AccessiblePressable";
import { mobileTheme } from "./theme";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={message} style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.errorBox}>
      <Text style={styles.error}>{message}</Text>
      <AccessiblePressable label="Try again" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retry}>Try again</Text>
      </AccessiblePressable>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <Text accessibilityRole="text" style={styles.empty}>{message}</Text>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: mobileTheme.spacing.xxl, gap: mobileTheme.spacing.md },
  subtitle: { color: mobileTheme.colors.textMuted, fontSize: mobileTheme.typography.body },
  errorBox: { padding: mobileTheme.spacing.lg, borderRadius: mobileTheme.radius.md, backgroundColor: mobileTheme.colors.dangerBackground, marginVertical: mobileTheme.spacing.sm },
  error: { color: mobileTheme.colors.dangerText, marginBottom: mobileTheme.spacing.sm, fontSize: mobileTheme.typography.body },
  retryButton: { alignSelf: "flex-start" },
  retry: { color: mobileTheme.colors.text, fontWeight: "700", fontSize: mobileTheme.typography.body },
  empty: { color: mobileTheme.colors.textSubtle, paddingVertical: mobileTheme.spacing.sm, fontSize: mobileTheme.typography.body },
});
