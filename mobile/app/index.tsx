import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

const roles = [
  { label: "Teacher", href: "/teacher" as const },
  { label: "Student", href: "/student" as const },
  { label: "Parent", href: "/parent" as const },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.eyebrow}>SCHOOL ERP</Text>
      <Text style={styles.title}>Mobile foundation</Text>
      <Text style={styles.body}>
        React Native + TypeScript shell connected to the existing portal API
        contracts. Authentication and role data remain server-authorized.
      </Text>

      <View style={styles.roleList}>
        {roles.map((role) => (
          <Link key={role.href} href={role.href} style={styles.roleLink}>
            {role.label} workspace
          </Link>
        ))}
      </View>
    </View>
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
  roleLink: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 12,
  },
});
