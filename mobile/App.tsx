import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator, type NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import type { LoginCredentials } from "./src/auth/types";
import { getMobileRoleShell } from "./src/navigation/roleNavigation";
import { ParentPortalScreen, StudentPortalScreen } from "./src/portal/PortalScreens";
import { TeacherScreen } from "./src/teacher/TeacherScreen";
import { mobileTheme } from "./src/ui/theme";
import { useReducedMotion } from "./src/ui/useReducedMotion";

export type RootStackParamList = { Home: undefined; Teacher: undefined; Student: undefined; Parent: undefined; Unauthorized: undefined };
type HomeProps = NativeStackScreenProps<RootStackParamList, "Home">;
const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: "", password: "", schoolCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setError(null); setSubmitting(true);
    try { await login({ email: credentials.email.trim(), password: credentials.password, ...(credentials.schoolCode?.trim() ? { schoolCode: credentials.schoolCode.trim() } : {}) }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in"); }
    finally { setSubmitting(false); }
  };
  return <View style={styles.container}>
    <StatusBar style="auto" />
    <Text style={styles.eyebrow}>SCHOOL ERP</Text>
    <Text accessibilityRole="header" style={styles.title}>Sign in</Text>
    <Text style={styles.body}>Use the same school account as the web application.</Text>
    <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="Email" value={credentials.email} onChangeText={(email) => setCredentials((current) => ({ ...current, email }))} style={styles.input} />
    <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="password" placeholder="Password" secureTextEntry value={credentials.password} onChangeText={(password) => setCredentials((current) => ({ ...current, password }))} style={styles.input} />
    <TextInput accessibilityLabel="School code" autoCapitalize="characters" placeholder="School code (required for school users)" value={credentials.schoolCode} onChangeText={(schoolCode) => setCredentials((current) => ({ ...current, schoolCode }))} style={styles.input} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityLabel={submitting ? "Signing in" : "Sign in"} accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.primaryButton, (pressed || submitting) && styles.buttonPressed]}>
      <Text style={styles.primaryButtonText}>{submitting ? "Signing in…" : "Sign in"}</Text>
    </Pressable>
  </View>;
}

function HomeScreen({ navigation }: HomeProps) {
  const { user, logout } = useAuth(); const shell = getMobileRoleShell(user?.role);
  return <View style={styles.container}>
    <StatusBar style="auto" />
    <Text style={styles.eyebrow}>SCHOOL ERP</Text>
    <Text accessibilityRole="header" style={styles.title}>{shell ? `${shell.title} portal` : "Mobile portal"}</Text>
    <Text style={styles.body}>{user?.email}</Text>
    {shell ? <Pressable accessibilityRole="button" accessibilityLabel={`Open ${shell.title} workspace`} onPress={() => navigation.navigate(shell.routeName)} style={({ pressed }) => [styles.roleButton, pressed && styles.buttonPressed]}><Text style={styles.roleButtonText}>Open {shell.title} workspace</Text></Pressable> : <Text accessibilityRole="alert" style={styles.error}>Your account does not have a supported mobile portal.</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={() => void logout()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable>
  </View>;
}

function UnauthorizedScreen() { return <View style={styles.container}><Text style={styles.eyebrow}>SCHOOL ERP</Text><Text accessibilityRole="header" style={styles.title}>Portal unavailable</Text><Text style={styles.body}>This account does not have access to a supported mobile portal.</Text></View>; }

function AuthenticatedApp() {
  const { user } = useAuth(); const shell = getMobileRoleShell(user?.role); const reducedMotion = useReducedMotion();
  const linking: LinkingOptions<RootStackParamList> = { prefixes: ["schoolerp://"], config: { screens: { Home: "home", ...(shell ? { [shell.routeName]: shell.path } : {}), Unauthorized: "unauthorized" } } };
  return <NavigationContainer key={`mobile-${user?.id}-${user?.role ?? "unknown"}`} linking={linking}><Stack.Navigator screenOptions={{ animation: reducedMotion ? "none" : "default" }}>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: "School ERP" }} />
    {shell?.routeName === "Teacher" ? <Stack.Screen name="Teacher" component={TeacherScreen} options={{ title: "Teacher" }} /> : null}
    {shell?.routeName === "Student" ? <Stack.Screen name="Student" component={StudentPortalScreen} options={{ title: "Student" }} /> : null}
    {shell?.routeName === "Parent" ? <Stack.Screen name="Parent" component={ParentPortalScreen} options={{ title: "Parent" }} /> : null}
    {!shell ? <Stack.Screen name="Unauthorized" component={UnauthorizedScreen} options={{ title: "Unavailable" }} /> : null}
  </Stack.Navigator></NavigationContainer>;
}

function AppContent() { const { status } = useAuth(); if (status === "loading") return <View style={styles.container}><ActivityIndicator accessibilityLabel="Restoring session" size="large" /><Text style={styles.body}>Restoring your secure session…</Text></View>; if (status === "authenticated") return <AuthenticatedApp />; return <LoginScreen />; }
export default function App() { return <AuthProvider><AppContent /></AuthProvider>; }

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: mobileTheme.spacing.xxl, backgroundColor: mobileTheme.colors.background },
  eyebrow: { fontSize: mobileTheme.typography.small, fontWeight: "700", letterSpacing: 1.4, marginBottom: 8, color: mobileTheme.colors.textMuted },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 12, color: mobileTheme.colors.text },
  body: { fontSize: 16, lineHeight: 24, color: mobileTheme.colors.textMuted, marginBottom: 24 },
  input: { minHeight: mobileTheme.touchTarget, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: mobileTheme.colors.surface, fontSize: 16 },
  error: { color: mobileTheme.colors.dangerText, marginBottom: 12 },
  primaryButton: { minHeight: mobileTheme.touchTarget, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: mobileTheme.colors.active, marginTop: 4 },
  primaryButtonText: { color: mobileTheme.colors.activeText, fontSize: 16, fontWeight: "600" },
  roleButton: { minHeight: mobileTheme.touchTarget, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 10, backgroundColor: mobileTheme.colors.active },
  roleButtonText: { color: mobileTheme.colors.activeText, fontSize: 16, fontWeight: "600" },
  secondaryButton: { minHeight: mobileTheme.touchTarget, justifyContent: "center", alignItems: "center", marginTop: 20 },
  secondaryButtonText: { fontSize: 16, fontWeight: "600", color: "#334155" },
  buttonPressed: { opacity: 0.72 },
});
