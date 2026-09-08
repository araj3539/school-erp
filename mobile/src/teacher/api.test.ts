import assert from "node:assert/strict";
import test from "node:test";
import { createTeacherApi } from "./api";

test("teacher workspace can scope reads to an explicit calendar date", async () => {
  const paths: string[] = [];
  const api = createTeacherApi(async (path) => { paths.push(path); return {} as never; });
  await api.getWorkspace("2026-09-05");
  assert.deepEqual(paths, ["/portal/teacher/workspace?date=2026-09-05"]);
});

test("teacher workspace defaults to the server current date", async () => {
  const paths: string[] = [];
  const api = createTeacherApi(async (path) => { paths.push(path); return {} as never; });
  await api.getWorkspace();
  assert.deepEqual(paths, ["/portal/teacher/workspace"]);
});

test("teacher API posts attendance records through the protected attendance endpoint", async () => {
  const calls: Array<{ path: string; options?: RequestInit }> = [];
  const api = createTeacherApi(async (path, options) => { calls.push({ path, options }); return { attendance: {}, corrected: false } as never; });
  await api.markAttendance({ date: "2026-09-08", classId: "66a000000000000000000010", sectionId: "66a000000000000000000011", records: [{ studentId: "66a000000000000000000012", status: "present" }] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/attendance");
  assert.equal(calls[0].options?.method, "POST");
  assert.equal(calls[0].options?.body, JSON.stringify({ date: "2026-09-08", classId: "66a000000000000000000010", sectionId: "66a000000000000000000011", records: [{ studentId: "66a000000000000000000012", status: "present" }] }));
});
