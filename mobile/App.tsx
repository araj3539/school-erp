import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { AuthProvider, useAuth } from "./src/auth/AuthProvider";
import type { LoginCredentials } from "./src/auth/types";

type RootStackParamList = {
  Home: undefined;
  Teacher: undefined;
  Student: undefined;
  Parent: undefined;
};

type HomeProps = NativeStackScreenProps<RootStackParamList, "Home">;

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoginScreen() {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email: "", password: "", schoolCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login({
        email: credentials.email.trim(),
        password: credentials.password,
        ...(credentials.schoolCode?.trim() ? { schoolCode: credentials.schoolCode.trim() } : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.eyebrow}>SCHOOL ERP</Text>
      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.body}>Use the same school account as the web application.</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        value={credentials.email}
        onChangeText={(email) => setCredentials((current) => ({ ...current, email }))}
        style={styles.input}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Password"
        secureTextEntry
        value={credentials.password}
        onChangeText={(password) => setCredentials((current) => ({ ...current, password }))}
        style={styles.input}
      />
      <TextInput
        autoCapitalize="characters"
        placeholder="School code (required for school users)"
        value={credentials.schoolCode}
        onChangeText={(schoolCode) => setCredentials((current) => ({ ...current, schoolCode }))}
        style={styles.input}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: submitting }}
        disabled={submitting}
        onPress={() => void submit()}
        style={({ pressed }) => [styles.primaryButton, (pressed || submitting) && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>{submitting ? "Signing in…" : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}

function HomeScreen({ navigation }: HomeProps) {
  const { user, logout } = useAuth();
  const roles: Array<{ label: string; route: "Teacher" | "Student" | "Parent" }> = [
    { label: "Teacher workspace", route: "Teacher" },
    { label: "Student workspace", route: "Student" },
    { label: "Parent workspace", route: "Parent" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.eyebrow}>SCHOOL ERP</Text>
      <Text style={styles.title}>Mobile foundation</Text>
      <Text style={styles.body}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>
      <View style={styles.roleList}>
        {roles.map((role) => (
          <Pressable
            key={role.route}
            accessibilityRole="button"
            onPress={() => navigation.navigate(role.route)}
            style={({ pressed }) => [styles.roleButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.roleButtonText}>{role.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

function RoleScreen({ role }: { role: "Teacher" | "Student" | "Parent" }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} workspace</Text>
      <Text style={styles.body}>
        Authentication is active. Role-specific data remains protected by the API and will be added in the next mobile slices.
      </Text>
    </View>
  );
}

function AuthenticatedApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "School ERP" }} />
        <Stack.Screen name="Teacher" options={{ title: "Teacher" }}>
          {() => <RoleScreen role="Teacher" />}
        </Stack.Screen>
        <Stack.Screen name="Student" options={{ title: "Student" }}>
          {() => <RoleScreen role="Student" />}
        </Stack.Screen>
        <Stack.Screen name="Parent" options={{ title: "Parent" }}>
          {() => <RoleScreen role="Parent" />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator accessibilityLabel="Restoring session" size="large" />
        <Text style={styles.body}>Restoring your secure session…</Text>
      </View>
    );
  }
  if (status === "authenticated") return <AuthenticatedApp />;
  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
    marginBottom: 24,
  },
  role: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
    textTransform: "capitalize",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  error: {
    color: "#b91c1c",
    marginBottom: 12,
  },
  roleList: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  roleButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  roleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
