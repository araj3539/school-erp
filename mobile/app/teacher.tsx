import { StyleSheet, Text, View } from "react-native";

export default function TeacherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teacher workspace</Text>
      <Text style={styles.body}>The authenticated teacher API integration is the next implementation slice.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  body: { fontSize: 16, lineHeight: 24 },
});
