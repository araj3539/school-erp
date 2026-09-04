import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

type RootStackParamList = {
  Home: undefined;
  Teacher: undefined;
  Student: undefined;
  Parent: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.eyebrow}>SCHOOL ERP</Text>
      <Text style={styles.title}>Mobile foundation</Text>
      <Text style={styles.body}>
        React Native + TypeScript foundation for the existing School ERP API.
        Authentication and authorization remain server-side responsibilities.
      </Text>
      <Text style={styles.caption}>
        Role navigation is wired for the next authenticated portal slice.
      </Text>
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
    marginBottom: 16,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
});
