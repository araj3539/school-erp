import assert from "node:assert/strict";
import test from "node:test";
import { createPortalApi } from "./api";

test("student workspace uses the self-scoped portal endpoint", async () => {
  const paths: string[] = [];
  const api = createPortalApi(async (path) => {
    paths.push(path);
    return {} as never;
  });

  await api.getStudentWorkspace();
  assert.deepEqual(paths, ["/portal/student/workspace"]);
});

test("parent workspace includes an explicit selected child id", async () => {
  const paths: string[] = [];
  const api = createPortalApi(async (path) => {
    paths.push(path);
    return {} as never;
  });

  await api.getParentWorkspace("child/123");
  assert.deepEqual(paths, ["/portal/parent/workspace?childId=child%2F123"]);
});

test("parent workspace can request the server-selected first child", async () => {
  const paths: string[] = [];
  const api = createPortalApi(async (path) => {
    paths.push(path);
    return {} as never;
  });

  await api.getParentWorkspace();
  assert.deepEqual(paths, ["/portal/parent/workspace"]);
});
