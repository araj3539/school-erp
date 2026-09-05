export type TeacherWorkspaceResponse = {
  teacher: { _id: string; firstName: string; lastName?: string };
  academicYear: { _id: string; name: string; startDate?: string; endDate?: string };
  date: string;
  assignedClasses: Array<Record<string, unknown>>;
  assignedSections: Array<Record<string, unknown>>;
  assignedStudents: Array<Record<string, unknown>>;
  todayTimetable: Array<Record<string, unknown>>;
  attendance: Array<Record<string, unknown>>;
  permissions: { canMarkAttendance: boolean };
};
