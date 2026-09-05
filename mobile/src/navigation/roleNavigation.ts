import { UserRole } from "@school-erp/shared";

export type MobilePortalRole = UserRole.TEACHER | UserRole.STUDENT | UserRole.PARENT;

export type MobileRoleShell = {
  role: MobilePortalRole;
  routeName: "Teacher" | "Student" | "Parent";
  path: "teacher" | "student" | "parent";
  title: "Teacher" | "Student" | "Parent";
};

const ROLE_SHELLS: Record<MobilePortalRole, MobileRoleShell> = {
  [UserRole.TEACHER]: {
    role: UserRole.TEACHER,
    routeName: "Teacher",
    path: "teacher",
    title: "Teacher",
  },
  [UserRole.STUDENT]: {
    role: UserRole.STUDENT,
    routeName: "Student",
    path: "student",
    title: "Student",
  },
  [UserRole.PARENT]: {
    role: UserRole.PARENT,
    routeName: "Parent",
    path: "parent",
    title: "Parent",
  },
};

export function getMobileRoleShell(role: UserRole | null | undefined): MobileRoleShell | null {
  if (!role) return null;
  return ROLE_SHELLS[role as MobilePortalRole] ?? null;
}

export function isMobilePortalRole(role: UserRole | null | undefined): role is MobilePortalRole {
  return getMobileRoleShell(role) !== null;
}

export function getMobileRolePath(role: UserRole | null | undefined): string | null {
  return getMobileRoleShell(role)?.path ?? null;
}
