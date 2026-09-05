export type MobilePortalRole = "teacher" | "student" | "parent";

export type MobileRoleShell = {
  role: MobilePortalRole;
  routeName: "Teacher" | "Student" | "Parent";
  path: "teacher" | "student" | "parent";
  title: "Teacher" | "Student" | "Parent";
};

const ROLE_SHELLS: Record<MobilePortalRole, MobileRoleShell> = {
  teacher: { role: "teacher", routeName: "Teacher", path: "teacher", title: "Teacher" },
  student: { role: "student", routeName: "Student", path: "student", title: "Student" },
  parent: { role: "parent", routeName: "Parent", path: "parent", title: "Parent" },
};

export function getMobileRoleShell(role: string | null | undefined): MobileRoleShell | null {
  if (!role) return null;
  return ROLE_SHELLS[role as MobilePortalRole] ?? null;
}

export function isMobilePortalRole(role: string | null | undefined): role is MobilePortalRole {
  return getMobileRoleShell(role) !== null;
}

export function getMobileRolePath(role: string | null | undefined): string | null {
  return getMobileRoleShell(role)?.path ?? null;
}
