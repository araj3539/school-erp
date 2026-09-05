import assert from "node:assert/strict";
import test from "node:test";
import { UserRole } from "@school-erp/shared";
import { getMobileRolePath, getMobileRoleShell, isMobilePortalRole } from "./roleNavigation";

test("teacher, student and parent each map to exactly one mobile shell", () => {
  assert.deepEqual(getMobileRoleShell(UserRole.TEACHER), {
    role: UserRole.TEACHER,
    routeName: "Teacher",
    path: "teacher",
    title: "Teacher",
  });
  assert.equal(getMobileRolePath(UserRole.STUDENT), "student");
  assert.equal(getMobileRolePath(UserRole.PARENT), "parent");
});

test("management roles do not receive a mobile portal shell", () => {
  assert.equal(getMobileRoleShell(UserRole.PRINCIPAL), null);
  assert.equal(getMobileRoleShell(UserRole.ACCOUNTANT), null);
  assert.equal(getMobileRoleShell(UserRole.SUPER_ADMIN), null);
  assert.equal(isMobilePortalRole(UserRole.PRINCIPAL), false);
});

test("missing or malformed identity fails closed", () => {
  assert.equal(getMobileRoleShell(null), null);
  assert.equal(getMobileRoleShell(undefined), null);
  assert.equal(getMobileRoleShell("not-a-role" as UserRole), null);
  assert.equal(getMobileRolePath("not-a-role" as UserRole), null);
});
