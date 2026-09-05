export const mobileQueryKeys = {
  all: ["mobile"] as const,
  me: () => [...mobileQueryKeys.all, "me"] as const,
  dashboard: () => [...mobileQueryKeys.all, "dashboard"] as const,
  students: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "students", query] as const,
  attendance: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "attendance", query] as const,
  homework: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "homework", query] as const,
  notices: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "notices", query] as const,
  timetable: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "timetable", query] as const,
  exams: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "exams", query] as const,
  examResults: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "exam-results", query] as const,
  fees: (query: Record<string, string | number | undefined> = {}) =>
    [...mobileQueryKeys.all, "fees", query] as const,
  teacherPortal: () => [...mobileQueryKeys.all, "portal", "teacher"] as const,
  studentPortal: () => [...mobileQueryKeys.all, "portal", "student"] as const,
  parentPortal: (childId?: string) => [...mobileQueryKeys.all, "portal", "parent", childId ?? null] as const,
};

/**
 * Mutation invalidation boundaries. Keep these mappings here so feature screens
 * do not invent cache semantics or duplicate server business rules.
 */
export const mobileInvalidationKeys = {
  afterStudentMutation: () => [mobileQueryKeys.students()] as const,
  afterAttendanceMutation: () => [mobileQueryKeys.attendance(), mobileQueryKeys.dashboard()] as const,
  afterHomeworkMutation: () => [mobileQueryKeys.homework(), mobileQueryKeys.dashboard()] as const,
  afterNoticeMutation: () => [mobileQueryKeys.notices(), mobileQueryKeys.dashboard()] as const,
};
