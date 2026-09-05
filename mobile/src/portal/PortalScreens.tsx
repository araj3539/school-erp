import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../auth/api";
import { createPortalApi } from "./api";
import type { ParentPortalResponse, PortalStudent, StudentPortalResponse } from "./types";

function textValue(value: unknown, fallback = "—") {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "name" in value) return String((value as { name?: unknown }).name ?? fallback);
  return fallback;
}

function studentName(student: PortalStudent | null | undefined) {
  if (!student) return "Student";
  return `${student.firstName} ${student.lastName ?? ""}`.trim();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Empty({ label }: { label: string }) {
  return <Text style={styles.empty}>{label}</Text>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.errorBox}><Text style={styles.error}>{message}</Text><Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.retry}>Try again</Text></Pressable></View>;
}

function Summary({ data }: { data: StudentPortalResponse["summary"] | ParentPortalResponse["summary"] }) {
  if (!data) return <Empty label="No summary is available for this child." />;
  const feeBalance = typeof data.feeBalance === "number" ? data.feeBalance : data.feeBalance.balance;
  return <View style={styles.summaryRow}>
    <View style={styles.card}><Text style={styles.cardValue}>{data.attendanceRate}%</Text><Text style={styles.cardLabel}>Attendance</Text></View>
    <View style={styles.card}><Text style={styles.cardValue}>{data.attendancePresent}/{data.attendanceTotal}</Text><Text style={styles.cardLabel}>Present</Text></View>
    <View style={styles.card}><Text style={styles.cardValue}>{feeBalance}</Text><Text style={styles.cardLabel}>Fee balance</Text></View>
  </View>;
}

function List({ items, label, render }: { items: Array<Record<string, unknown>>; label: string; render: (item: Record<string, unknown>, index: number) => string }) {
  if (!items.length) return <Empty label={`No ${label.toLowerCase()} available.`} />;
  return <View>{items.slice(0, 6).map((item, index) => <View key={String(item._id ?? index)} style={styles.listItem}><Text style={styles.itemTitle}>{render(item, index)}</Text></View>)}</View>;
}

function PortalLayout({ title, subtitle, refreshing, onRefresh, children }: { title: string; subtitle: string; refreshing: boolean; onRefresh: () => void; children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
    <Text style={styles.eyebrow}>SCHOOL ERP</Text><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text>
    {refreshing ? <Text style={styles.stale}>Refreshing live data…</Text> : null}{children}
  </ScrollView>;
}

export function StudentPortalScreen() {
  const { request, user } = useAuth();
  const api = useMemo(() => createPortalApi(request), [request]);
  const [data, setData] = useState<StudentPortalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (background = false) => {
    if (!background) setRefreshing(true); setError(null);
    try { setData(await api.getStudentWorkspace()); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Unable to load your portal."); }
    finally { setRefreshing(false); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  if (!data && error) return <PortalLayout title="Student portal" subtitle={user?.email ?? ""} refreshing={false} onRefresh={() => void load()}><ErrorState message={error} onRetry={() => void load()} /></PortalLayout>;
  if (!data) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.subtitle}>Loading your portal…</Text></View>;

  return <PortalLayout title={studentName(data.student)} subtitle={`${textValue(data.student.classId)} • ${textValue(data.student.sectionId)} • ${data.academicYear.name}`} refreshing={refreshing} onRefresh={() => void load()}>
    <Summary data={data.summary} />
    {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
    <Section title="Today"><List items={data.todayClasses} label="Classes" render={(item) => `${textValue(item.subjectId, "Class")} • ${textValue(item.startTime)}–${textValue(item.endTime)}`} /></Section>
    <Section title="Homework"><List items={data.upcomingHomework} label="Homework" render={(item) => `${textValue(item.title, "Homework")} • due ${textValue(item.dueDate)}`} /></Section>
    <Section title="Results"><List items={data.latestResults} label="Results" render={(item) => textValue(item.examId, "Published result")} /></Section>
    <Section title="Attendance"><List items={data.recentAttendance} label="Attendance history" render={(item) => `${textValue(item.date)} • attendance record`} /></Section>
    <Section title="Exams"><List items={data.upcomingExams} label="Exams" render={(item) => `${textValue(item.name, "Exam")} • ${textValue(item.startDate)}`} /></Section>
    <Section title="Notices"><List items={data.notices} label="Notices" render={(item) => textValue(item.title, "School notice")} /></Section>
  </PortalLayout>;
}

export function ParentPortalScreen() {
  const { request, user } = useAuth();
  const api = useMemo(() => createPortalApi(request), [request]);
  const [data, setData] = useState<ParentPortalResponse | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (childId = selectedChildId) => {
    setRefreshing(true); setError(null);
    try {
      const next = await api.getParentWorkspace(childId);
      setData(next);
      setSelectedChildId(next.selectedChild?._id);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Unable to load your children's portal."); }
    finally { setRefreshing(false); }
  }, [api, selectedChildId]);
  useEffect(() => { void load(); }, [load]);

  if (!data && error) return <PortalLayout title="Parent portal" subtitle={user?.email ?? ""} refreshing={false} onRefresh={() => void load()}><ErrorState message={error} onRetry={() => void load()} /></PortalLayout>;
  if (!data) return <View style={styles.center}><ActivityIndicator size="large" /><Text style={styles.subtitle}>Loading your portal…</Text></View>;
  const child = data.selectedChild;

  return <PortalLayout title="Parent portal" subtitle={child ? studentName(child) : "No linked children"} refreshing={refreshing} onRefresh={() => void load()}>
    <Section title="Linked children">
      {!data.children.length ? <Empty label="No linked children are available." /> : <ScrollView horizontal showsHorizontalScrollIndicator={false}>{data.children.map((item) => <Pressable key={item._id} accessibilityRole="button" accessibilityState={{ selected: item._id === child?._id }} onPress={() => { setSelectedChildId(item._id); void load(item._id); }} style={[styles.childChip, item._id === child?._id && styles.childChipActive]}><Text style={item._id === child?._id ? styles.childTextActive : styles.childText}>{studentName(item)}</Text></Pressable>)}</ScrollView>}
    </Section>
    {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
    {child ? <>
      <Text style={styles.profile}>{textValue(child.classId)} • {textValue(child.sectionId)} • {data.academicYear.name}</Text>
      <Summary data={data.summary} />
      <Section title="Today"><List items={data.todayClasses} label="Classes" render={(item) => `${textValue(item.subjectId, "Class")} • ${textValue(item.startTime)}–${textValue(item.endTime)}`} /></Section>
      <Section title="Homework"><List items={data.upcomingHomework} label="Homework" render={(item) => `${textValue(item.title, "Homework")} • due ${textValue(item.dueDate)}`} /></Section>
      <Section title="Attendance"><List items={data.attendance} label="Attendance history" render={(item) => `${textValue(item.date)} • attendance record`} /></Section>
      <Section title="Exams"><List items={data.upcomingExams} label="Exams" render={(item) => `${textValue(item.name, "Exam")} • ${textValue(item.startDate)}`} /></Section>
      <Section title="Notices"><List items={data.notices} label="Notices" render={(item) => textValue(item.title, "School notice")} /></Section>
    </> : <Empty label="Select a linked child to view authorized information." />}
  </PortalLayout>;
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", letterSpacing: 1.4, marginBottom: 6 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 6 },
  subtitle: { color: "#475569", fontSize: 15, marginBottom: 14 },
  profile: { color: "#475569", marginBottom: 14 },
  stale: { color: "#92400e", marginBottom: 10 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  card: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0" },
  cardValue: { fontSize: 20, fontWeight: "700" }, cardLabel: { color: "#64748b", marginTop: 4, fontSize: 12 },
  section: { marginTop: 18, padding: 14, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  listItem: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" }, itemTitle: { color: "#334155" },
  empty: { color: "#64748b", paddingVertical: 8 },
  errorBox: { padding: 14, borderRadius: 10, backgroundColor: "#fef2f2", marginVertical: 8 }, error: { color: "#b91c1c", marginBottom: 8 }, retry: { color: "#0f172a", fontWeight: "700" },
  childChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#f1f5f9", marginRight: 8 }, childChipActive: { backgroundColor: "#0f172a" }, childText: { color: "#334155", fontWeight: "600" }, childTextActive: { color: "#fff", fontWeight: "600" },
});
