import assert from "node:assert/strict";
import test from "node:test";
import { createTeacherApi } from "./api";

test("teacher workspace can scope reads to an explicit calendar date", async () => {
  const paths: string[] = [];
  const api = createTeacherApi(async (path) => {
    paths.push(path);
    return {} as never;
  });

  await api.getWorkspace("2026-09-05");
  assert.deepEqual(paths, ["/portal/teacher/workspace?date=2026-09-05"]);
});

test("teacher workspace defaults to the server current date", async () => {
  const paths: string[] = [];
  const api = createTeacherApi(async (path) => {
    paths.push(path);
    return {} as never;
  });

  await api.getWorkspace();
  assert.deepEqual(paths, ["/portal/teacher/workspace"]);
});
