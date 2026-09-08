import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../auth/api";
import { EmptyState, ErrorState, LoadingState } from "../ui/StateView";
import { mobileTheme } from "../ui/theme";
import { createTeacherApi } from "./api";
import type { TeacherWorkspaceResponse } from "./types";

type Status = "present" | "absent" | "late" | "half_day" | "on_leave";
const STATUSES: Array<{ value: Status; label: string }> = [
  { value: "present", label: "Present" }, { value: "absent", label: "Absent" }, { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" }, { value: "on_leave", label: "On leave" },
];
function idOf(item: unknown): string { if (typeof item === "string") return item; if (!item || typeof item !== "object") return ""; const value = (item as Record<string, unknown>)._id; return typeof value === "string" ? value : String(value ?? ""); }
function value(item: unknown, key: string, fallback = "—") { if (!item || typeof item !== "object") return fallback; const raw = (item as Record<string, unknown>)[key]; if (typeof raw === "string" || typeof raw === "number") return String(raw); if (raw && typeof raw === "object" && "name" in raw) return String((raw as { name?: unknown }).name ?? fallback); if (raw && typeof raw === "object" && "displayName" in raw) return String((raw as { displayName?: unknown }).displayName ?? fallback); return fallback; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.section}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function List({ items, empty, render }: { items: Array<Record<string, unknown>>; empty: string; render: (item: Record<string, unknown>) => string }) { if (!items.length) return <EmptyState message={empty} />; return <View>{items.slice(0, 12).map((item, index) => <View key={String(item._id ?? index)} style={styles.row}><Text style={styles.rowText}>{render(item)}</Text></View>)}</View>; }
function ChoiceRow({ label, selected, onPress, testID, disabled = false }: { label: string; selected: boolean; onPress: () => void; testID: string; disabled?: boolean }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} testID={testID} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, disabled && styles.choiceDisabled, pressed && styles.pressed]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>; }

export function TeacherScreen() {
  const { request, user } = useAuth(); const api = useMemo(() => createTeacherApi(request), [request]);
  const [data, setData] = useState<TeacherWorkspaceResponse | null>(null); const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false); const [saving, setSaving] = useState(false); const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState(""); const [selectedSectionId, setSelectedSectionId] = useState(""); const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const loadSequence = useRef(0);

  const load = useCallback(async () => { const sequence = ++loadSequence.current; setRefreshing(true); setError(null); setSavedMessage(null); try { const nextData = await api.getWorkspace(); if (sequence === loadSequence.current) setData(nextData); } catch (cause) { if (sequence === loadSequence.current) setError(cause instanceof ApiError ? cause.message : "Unable to load the teacher workspace."); } finally { if (sequence === loadSequence.current) setRefreshing(false); } }, [api]);
  useEffect(() => { void load(); return () => { loadSequence.current += 1; }; }, [load]);

  const classOptions = data?.assignedClasses ?? [];
  const sectionOptions = useMemo(() => (data?.assignedSections ?? []).filter((item) => idOf(item.classId) === selectedClassId), [data, selectedClassId]);
  const studentOptions = useMemo(() => (data?.assignedStudents ?? []).filter((item) => idOf(item.classId) === selectedClassId && idOf(item.sectionId) === selectedSectionId), [data, selectedClassId, selectedSectionId]);
  const existingAttendance = useMemo(() => (data?.attendance ?? []).find((item) => idOf(item.classId) === selectedClassId && idOf(item.sectionId) === selectedSectionId), [data, selectedClassId, selectedSectionId]);
  const hasExistingAttendance = Boolean(existingAttendance);

  useEffect(() => { if (!selectedClassId && classOptions.length) setSelectedClassId(idOf(classOptions[0])); if (selectedClassId && !classOptions.some((item) => idOf(item) === selectedClassId)) setSelectedClassId(classOptions.length ? idOf(classOptions[0]) : ""); }, [classOptions, selectedClassId]);
  useEffect(() => { if (!sectionOptions.some((item) => idOf(item) === selectedSectionId)) setSelectedSectionId(sectionOptions.length ? idOf(sectionOptions[0]) : ""); }, [sectionOptions, selectedSectionId]);
  useEffect(() => { const next: Record<string, Status> = {}; studentOptions.forEach((student) => { next[idOf(student)] = "present"; }); const records = existingAttendance?.records; if (Array.isArray(records)) records.forEach((record) => { if (record && typeof record === "object") { const studentId = idOf((record as Record<string, unknown>).studentId); const status = (record as Record<string, unknown>).status; if (studentId && typeof status === "string" && STATUSES.some((item) => item.value === status)) next[studentId] = status as Status; } }); setStatuses(next); }, [studentOptions, existingAttendance]);

  const saveAttendance = useCallback(async () => {
    if (!data || !selectedClassId || !selectedSectionId || !studentOptions.length || hasExistingAttendance || !data.permissions.canMarkAttendance) return;
    setSaving(true); setError(null); setSavedMessage(null);
    try { await api.markAttendance({ date: data.date, classId: selectedClassId, sectionId: selectedSectionId, records: studentOptions.map((student) => ({ studentId: idOf(student), status: statuses[idOf(student)] ?? "present" })) }); setSavedMessage("Attendance saved successfully."); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : "Unable to save attendance."); } finally { setSaving(false); }
  }, [api, data, hasExistingAttendance, load, selectedClassId, selectedSectionId, statuses, studentOptions]);

  if (!data && error) return <View style={styles.center}><ErrorState message={error} onRetry={() => void load()} /></View>;
  if (!data) return <LoadingState message="Loading your workspace…" />;
  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load()} accessibilityLabel="Refresh teacher workspace" />}>
    <Text style={styles.eyebrow}>SCHOOL ERP</Text><Text accessibilityRole="header" style={styles.title}>{data.teacher.firstName} {data.teacher.lastName ?? ""}</Text>
    <Text style={styles.subtitle}>Teacher workspace • {data.academicYear.name} • {data.date}</Text>
    {refreshing ? <Text accessibilityLiveRegion="polite" style={styles.stale}>Refreshing live data…</Text> : null}
    {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}{savedMessage ? <Text accessibilityLiveRegion="polite" style={styles.success}>{savedMessage}</Text> : null}

    <Section title="Mark attendance"><Text style={styles.helper}>Choose an assigned class and section, then set each student’s status.</Text>
      <Text style={styles.controlLabel}>Class</Text><View style={styles.choiceWrap}>{classOptions.map((item) => <ChoiceRow key={idOf(item)} label={value(item, "displayName", value(item, "name", "Class"))} selected={idOf(item) === selectedClassId} onPress={() => { setSelectedClassId(idOf(item)); setSelectedSectionId(""); setSavedMessage(null); }} testID={`teacher-class-${idOf(item)}`} />)}</View>
      {selectedClassId ? <><Text style={styles.controlLabel}>Section</Text><View style={styles.choiceWrap}>{sectionOptions.map((item) => <ChoiceRow key={idOf(item)} label={value(item, "name", "Section")} selected={idOf(item) === selectedSectionId} onPress={() => { setSelectedSectionId(idOf(item)); setSavedMessage(null); }} testID={`teacher-section-${idOf(item)}`} />)}</View></> : null}
      {!sectionOptions.length && selectedClassId ? <EmptyState message="No sections are assigned to this class." /> : null}
      {selectedSectionId ? <><Text style={styles.dateLabel}>Attendance date: {data.date}</Text>
        {hasExistingAttendance ? <View style={styles.readOnly}><Text style={styles.readOnlyTitle}>Attendance already recorded</Text><Text style={styles.helper}>Teachers can create attendance, but existing records can only be corrected by school management.</Text></View> : null}
        {studentOptions.length ? studentOptions.map((student) => { const studentId = idOf(student); return <View key={studentId} style={styles.studentCard}><Text style={styles.studentName}>{value(student, "firstName")} {value(student, "lastName")}</Text><Text style={styles.studentMeta}>{value(student, "admissionNo")}</Text><View style={styles.statusWrap}>{STATUSES.map((status) => <ChoiceRow key={status.value} label={status.label} selected={statuses[studentId] === status.value} disabled={hasExistingAttendance} onPress={() => setStatuses((current) => ({ ...current, [studentId]: status.value }))} testID={`teacher-attendance-${studentId}-${status.value}`} />)}</View></View>; }) : <EmptyState message="No active students are assigned to this section." />}
        <Pressable accessibilityRole="button" accessibilityLabel="Save attendance" accessibilityState={{ disabled: saving || hasExistingAttendance || !studentOptions.length || !data.permissions.canMarkAttendance, busy: saving }} disabled={saving || hasExistingAttendance || !studentOptions.length || !data.permissions.canMarkAttendance} onPress={() => void saveAttendance()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed, (hasExistingAttendance || !studentOptions.length) && styles.disabledButton]}><Text style={styles.saveText}>{saving ? "Saving…" : "Save attendance"}</Text></Pressable>
      </> : null}
    </Section>

    <Section title="Today’s timetable"><List items={data.todayTimetable} empty="No timetable entries for today." render={(item) => `${value(item, "subjectId", "Subject")} • ${value(item, "classId", "Class")} • ${value(item, "startTime")}–${value(item, "endTime")}`} /></Section>
    <Section title="Assigned students"><List items={data.assignedStudents} empty="No assigned students found." render={(item) => `${value(item, "firstName")} ${value(item, "lastName")} • ${value(item, "admissionNo")} • ${value(item, "classId", "Class")}`} /></Section>
    <Section title="Recorded attendance"><List items={data.attendance} empty="No attendance records for the selected date." render={(item) => `${value(item, "classId", "Class")} • ${value(item, "sectionId", "Section")} • ${Array.isArray(item.records) ? `${item.records.length} student records` : "Attendance record"}`} /></Section>
    <View accessible accessibilityRole="summary" style={styles.permission}><Text style={styles.permissionTitle}>Attendance permission</Text><Text style={styles.subtitle}>{data.permissions.canMarkAttendance ? "You can mark attendance for your assigned classes." : "Attendance marking is unavailable for this account."}</Text></View>
    <Text style={styles.footer}>Assignment scope and authorization are enforced by the server; hiding an action in the app is not a security control.</Text><Text style={styles.account}>Signed in as {user?.email ?? "teacher"}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: mobileTheme.spacing.xl, paddingBottom: 40, backgroundColor: mobileTheme.colors.background }, center: { flex: 1, justifyContent: "center", padding: mobileTheme.spacing.xxl },
  eyebrow: { fontSize: mobileTheme.typography.small, fontWeight: "700", letterSpacing: 1.4, marginBottom: 6, color: mobileTheme.colors.textMuted }, title: { fontSize: mobileTheme.typography.title, fontWeight: "700", marginBottom: 6, color: mobileTheme.colors.text }, subtitle: { color: mobileTheme.colors.textMuted, fontSize: mobileTheme.typography.body }, stale: { color: mobileTheme.colors.warningText, marginTop: 10 },
  section: { marginTop: mobileTheme.spacing.lg, padding: mobileTheme.spacing.lg, backgroundColor: mobileTheme.colors.surface, borderRadius: mobileTheme.radius.md, borderWidth: 1, borderColor: mobileTheme.colors.border }, sectionTitle: { fontSize: mobileTheme.typography.section, fontWeight: "700", marginBottom: mobileTheme.spacing.sm, color: mobileTheme.colors.text }, helper: { color: mobileTheme.colors.textMuted, lineHeight: 21, marginBottom: 10 }, controlLabel: { fontSize: 14, fontWeight: "700", color: mobileTheme.colors.text, marginTop: 8, marginBottom: 6 }, choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { minHeight: mobileTheme.touchTarget, minWidth: 74, justifyContent: "center", alignItems: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: mobileTheme.colors.border, borderRadius: mobileTheme.radius.sm, backgroundColor: mobileTheme.colors.surface }, choiceSelected: { borderColor: mobileTheme.colors.active, backgroundColor: mobileTheme.colors.active }, choiceDisabled: { opacity: 0.7 }, choiceText: { color: mobileTheme.colors.text, fontWeight: "600", fontSize: 13 }, choiceTextSelected: { color: mobileTheme.colors.activeText },
  dateLabel: { marginTop: 14, fontWeight: "700", color: mobileTheme.colors.text }, studentCard: { marginTop: 12, padding: 12, borderRadius: mobileTheme.radius.sm, backgroundColor: mobileTheme.colors.background, borderWidth: 1, borderColor: mobileTheme.colors.border }, studentName: { fontWeight: "700", color: mobileTheme.colors.text, fontSize: 16 }, studentMeta: { color: mobileTheme.colors.textMuted, marginTop: 2, marginBottom: 8 }, statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  readOnly: { marginTop: 12, padding: 12, borderRadius: mobileTheme.radius.sm, backgroundColor: mobileTheme.colors.controlBackground }, readOnlyTitle: { fontWeight: "700", color: mobileTheme.colors.text, marginBottom: 4 }, saveButton: { minHeight: mobileTheme.touchTarget, marginTop: 16, borderRadius: mobileTheme.radius.sm, backgroundColor: mobileTheme.colors.text, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }, saveText: { color: mobileTheme.colors.surface, fontWeight: "700", fontSize: 16 }, disabledButton: { opacity: 0.5 }, success: { color: mobileTheme.colors.text, marginTop: 10, fontWeight: "600" }, pressed: { opacity: 0.72 },
  row: { minHeight: mobileTheme.touchTarget, justifyContent: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: mobileTheme.colors.borderSubtle }, rowText: { color: mobileTheme.colors.text, fontSize: mobileTheme.typography.body, lineHeight: 21 }, permission: { marginTop: mobileTheme.spacing.lg, padding: mobileTheme.spacing.lg, borderRadius: mobileTheme.radius.md, backgroundColor: mobileTheme.colors.successBackground }, permissionTitle: { fontWeight: "700", marginBottom: 4, color: mobileTheme.colors.text }, footer: { marginTop: mobileTheme.spacing.lg, color: mobileTheme.colors.textSubtle, lineHeight: 20 }, account: { marginTop: 10, color: mobileTheme.colors.textSubtle, fontSize: mobileTheme.typography.small },
});
