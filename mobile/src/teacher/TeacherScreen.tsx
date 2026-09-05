import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../auth/api";
import { AccessiblePressable } from "../ui/AccessiblePressable";
import { EmptyState, ErrorState, LoadingState } from "../ui/StateView";
import { mobileTheme } from "../ui/theme";
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
  return <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function List({ items, empty, render }: { items: Array<Record<string, unknown>>; empty: string; render: (item: Record<string, unknown>) => string }) {
  if (!items.length) return <EmptyState message={empty} />;
  return <View>{items.slice(0, 12).map((item, index) => <View key={String(item._id ?? index)} style={styles.row}><Text style={styles.rowText}>{render(item)}</Text></View>)}</View>;
}

export function TeacherScreen() {
  const { request, user } = useAuth();
  const api = useMemo(() => createTeacherApi(request), [request]);
  const [data, setData] = useState<TeacherWorkspaceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setData(await api.getWorkspace());
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Unable to load the teacher workspace.");
    } finally {
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (!data && error) return <View style={styles.center}><ErrorState message={error} onRetry={() => void load()} /></View>;
  if (!data) return <LoadingState message="Loading your workspace…" />;

  return <ScrollView
    contentContainerStyle={styles.container}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} accessibilityLabel="Refresh teacher workspace" />}
  >
    <Text style={styles.eyebrow}>SCHOOL ERP</Text>
    <Text accessibilityRole="header" style={styles.title}>{data.teacher.firstName} {data.teacher.lastName ?? ""}</Text>
    <Text style={styles.subtitle}>Teacher workspace • {data.academicYear.name} • {data.date}</Text>
    {refreshing ? <Text accessibilityLiveRegion="polite" style={styles.stale}>Refreshing live data…</Text> : null}
    {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}

    <Section title="Assigned classes">
      <List items={data.assignedClasses} empty="No assigned classes found." render={(item) => `${value(item, "displayName", value(item, "name", "Class"))}${value(item, "roomNumber") !== "—" ? ` • Room ${value(item, "roomNumber")}` : ""}`} />
    </Section>
    <Section title="Today’s timetable">
      <List items={data.todayTimetable} empty="No timetable entries for today." render={(item) => `${value(item, "subjectId", "Subject")} • ${value(item, "classId", "Class")} • ${value(item, "startTime")}–${value(item, "endTime")}`} />
    </Section>
    <Section title="Assigned students">
      <List items={data.assignedStudents} empty="No assigned students found." render={(item) => `${value(item, "firstName")} ${value(item, "lastName")} • ${value(item, "admissionNo")} • ${value(item, "classId", "Class")}`} />
    </Section>
    <Section title="Attendance">
      <List items={data.attendance} empty="No attendance records for the selected date." render={(item) => `${value(item, "classId", "Class")} • ${value(item, "sectionId", "Section")} • ${Array.isArray(item.records) ? `${item.records.length} student records` : "Attendance record"}`} />
    </Section>
    <View accessible accessibilityRole="summary" style={styles.permission}>
      <Text style={styles.permissionTitle}>Attendance permission</Text>
      <Text style={styles.subtitle}>{data.permissions.canMarkAttendance ? "You can mark attendance for your assigned classes." : "Attendance marking is unavailable for this account."}</Text>
    </View>
    <Text style={styles.footer}>Assignment scope and authorization are enforced by the server; hiding an action in the app is not a security control.</Text>
    <Text style={styles.account}>Signed in as {user?.email ?? "teacher"}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: mobileTheme.spacing.xl, paddingBottom: 40, backgroundColor: mobileTheme.colors.background },
  center: { flex: 1, justifyContent: "center", padding: mobileTheme.spacing.xxl },
  eyebrow: { fontSize: mobileTheme.typography.small, fontWeight: "700", letterSpacing: 1.4, marginBottom: 6, color: mobileTheme.colors.textMuted },
  title: { fontSize: mobileTheme.typography.title, fontWeight: "700", marginBottom: 6, color: mobileTheme.colors.text },
  subtitle: { color: mobileTheme.colors.textMuted, fontSize: mobileTheme.typography.body },
  stale: { color: mobileTheme.colors.warningText, marginTop: 10 },
  section: { marginTop: mobileTheme.spacing.lg, padding: mobileTheme.spacing.lg, backgroundColor: mobileTheme.colors.surface, borderRadius: mobileTheme.radius.md, borderWidth: 1, borderColor: mobileTheme.colors.border },
  sectionTitle: { fontSize: mobileTheme.typography.section, fontWeight: "700", marginBottom: mobileTheme.spacing.sm, color: mobileTheme.colors.text },
  row: { minHeight: mobileTheme.touchTarget, justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: mobileTheme.colors.borderSubtle },
  rowText: { color: "#334155", fontSize: mobileTheme.typography.body, lineHeight: 21 },
  permission: { marginTop: mobileTheme.spacing.lg, padding: mobileTheme.spacing.lg, borderRadius: mobileTheme.radius.md, backgroundColor: mobileTheme.colors.successBackground },
  permissionTitle: { fontWeight: "700", marginBottom: 4, color: mobileTheme.colors.text },
  footer: { marginTop: mobileTheme.spacing.lg, color: mobileTheme.colors.textSubtle, lineHeight: 20 },
  account: { marginTop: 10, color: "#94a3b8", fontSize: mobileTheme.typography.small },
});
