import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RootStackParamList = {
  Home: undefined;
  Teacher: undefined;
  Student: undefined;
  Parent: undefined;
};

type HomeProps = NativeStackScreenProps<RootStackParamList, "Home">;

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: HomeProps) {
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
      <Text style={styles.body}>
        React Native + TypeScript foundation for the existing School ERP API.
        Authentication and authorization remain server-side responsibilities.
      </Text>
      <View style={styles.roleList}>
        {roles.map((role) => (
          <Pressable
            key={role.route}
            accessibilityRole="button"
            onPress={() => navigation.navigate(role.route)}
            style={({ pressed }) => [styles.roleButton, pressed && styles.roleButtonPressed]}
          >
            <Text style={styles.roleButtonText}>{role.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RoleScreen({ role }: { role: "Teacher" | "Student" | "Parent" }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{role} workspace</Text>
      <Text style={styles.body}>
        This screen is intentionally read-only until mobile authentication and
        session handling are finalized against the existing API contract.
      </Text>
    </View>
  );
}

export default function App() {
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
  roleList: {
    gap: 12,
  },
  roleButton: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#0f172a",
  },
  roleButtonPressed: {
    opacity: 0.72,
  },
  roleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
