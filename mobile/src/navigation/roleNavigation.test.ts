import assert from "node:assert/strict";
import test from "node:test";
import { getMobileRolePath, getMobileRoleShell, isMobilePortalRole } from "./roleNavigation";

test("teacher, student and parent each map to exactly one mobile shell", () => {
  assert.deepEqual(getMobileRoleShell("teacher"), {
    role: "teacher",
    routeName: "Teacher",
    path: "teacher",
    title: "Teacher",
  });
  assert.equal(getMobileRolePath("student"), "student");
  assert.equal(getMobileRolePath("parent"), "parent");
});

test("management roles do not receive a mobile portal shell", () => {
  assert.equal(getMobileRoleShell("principal"), null);
  assert.equal(getMobileRoleShell("accountant"), null);
  assert.equal(getMobileRoleShell("super_admin"), null);
  assert.equal(isMobilePortalRole("principal"), false);
});

test("missing or malformed identity fails closed", () => {
  assert.equal(getMobileRoleShell(null), null);
  assert.equal(getMobileRoleShell(undefined), null);
  assert.equal(getMobileRoleShell("not-a-role"), null);
  assert.equal(getMobileRolePath("not-a-role"), null);
});
