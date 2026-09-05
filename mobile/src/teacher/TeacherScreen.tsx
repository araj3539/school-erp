import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../auth/api";
import { createTeacherApi } from "./api";
import type { TeacherWorkspaceResponse } from "./types";

function value(item: unknown, key: string, fallback = "—") {
  if (!item || typeof item !== "object") return fallback;
  const raw = (item as Record<string, unknown>)[key];
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (raw && typeof raw === "object" && "name" in raw) return String((raw as { name?: unknown }).name ?? fallback);
  if (raw && typeof raw === "object" && "displayName" in raw) return String((raw as { displayName?: unknown }).displayName ?? fallback);
  return fallback;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Empty({ label }: { label: string }) { return <Text style={styles.empty}>{label}</Text>; }

function ErrorBox({ message, retry }: { message: string; retry: () => void }) {
  return <View style={styles.errorBox}><Text style={styles.error}>{message}</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retry}>Try again</Text></Pressable></View>;
}

function List({ items, empty, render }: { items: Array<Record<string, unknown>>; empty: string; render: (item: Record<string, unknown>) => string }) {
  if (!items.length) return <Empty label={empty} />;
  return <View>{items.slice(0, 12).map((item, index) => <View key={String(item._id ?? index)} style={styles.row}><Text style={styles.rowText}>{render(item)}</Text></View>)}</View>;
}

export function TeacherScreen() {
  const { request, user } = useAuth();
  const api = useMemo(() => createTeacherApi(request), [request]);
  const [data, setData] = useState<TeacherWorkspaceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true); setError(null);
    try { setData(await api.getWorkspace()); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Unable to load the teacher workspace."); }
    finally { setRefreshing(false); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  if (!data && error) return <View style={styles.center}><ErrorBox message={error} retry={() => void load()} /></View>;
  if (!data) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.subtitle}>Loading your workspace…</Text></View>;

  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} />}>
    <Text style={styles.eyebrow}>SCHOOL ERP</Text>
    <Text style={styles.title}>{data.teacher.firstName} {data.teacher.lastName ?? ""}</Text>
    <Text style={styles.subtitle}>Teacher workspace • {data.academicYear.name} • {data.date}</Text>
    {refreshing ? <Text style={styles.stale}>Refreshing live data…</Text> : null}
    {error ? <ErrorBox message={error} retry={() => void load()} /> : null}
    <Section title="Assigned classes"><List items={data.assignedClasses} empty="No assigned classes found." render={(item) => `${value(item, "displayName", value(item, "name", "Class"))}${value(item, "roomNumber") !== "—" ? ` • Room ${value(item, "roomNumber")}` : ""}`} /></Section>
    <Section title="Today’s timetable"><List items={data.todayTimetable} empty="No timetable entries for today." render={(item) => `${value(item, "subjectId", "Subject")} • ${value(item, "classId", "Class")} • ${value(item, "startTime")}–${value(item, "endTime")}`} /></Section>
    <Section title="Assigned students"><List items={data.assignedStudents} empty="No assigned students found." render={(item) => `${value(item, "firstName")} ${value(item, "lastName")} • ${value(item, "admissionNo")} • ${value(item, "classId", "Class")}`} /></Section>
    <Section title="Attendance"><List items={data.attendance} empty="No attendance records for the selected date." render={(item) => `${value(item, "classId", "Class")} • ${value(item, "sectionId", "Section")} • ${Array.isArray(item.records) ? `${item.records.length} student records` : "Attendance record"}`} /></Section>
    <View style={styles.permission}><Text style={styles.permissionTitle}>Attendance permission</Text><Text style={styles.subtitle}>{data.permissions.canMarkAttendance ? "You can mark attendance for your assigned classes." : "Attendance marking is unavailable for this account."}</Text></View>
    <Text style={styles.footer}>Assignment scope and authorization are enforced by the server; hiding an action in the app is not a security control.</Text>
    <Text style={styles.account}>Signed in as {user?.email ?? "teacher"}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#f8fafc" }, center: { flex: 1, justifyContent: "center", padding: 24 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.4, marginBottom: 6 }, title: { fontSize: 30, fontWeight: "700", marginBottom: 6 }, subtitle: { color: "#475569", fontSize: 15 }, stale: { color: "#92400e", marginTop: 10 },
  section: { marginTop: 18, padding: 14, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" }, sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" }, rowText: { color: "#334155" }, empty: { color: "#64748b", paddingVertical: 8 },
  errorBox: { padding: 14, borderRadius: 10, backgroundColor: "#fef2f2", marginVertical: 8 }, error: { color: "#b91c1c", marginBottom: 8 }, retry: { color: "#0f172a", fontWeight: "700" },
  permission: { marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: "#ecfdf5" }, permissionTitle: { fontWeight: "700", marginBottom: 4 }, footer: { marginTop: 18, color: "#64748b", lineHeight: 20 }, account: { marginTop: 10, color: "#94a3b8", fontSize: 12 },
});
