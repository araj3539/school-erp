export type PortalSummary = {
  attendanceTotal: number;
  attendancePresent: number;
  attendanceRate: number;
  feeBalance: number | {
    totalDue: number;
    paid: number;
    balance: number;
    overdue: number;
  };
};

export type PortalStudent = {
  _id: string;
  admissionNo?: string;
  firstName: string;
  lastName?: string;
  classId?: { _id?: string; name?: string } | string | null;
  sectionId?: { _id?: string; name?: string } | string | null;
  status?: string;
};

export type PortalAcademicYear = {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
};

export type StudentPortalResponse = {
  role: "student";
  academicYear: PortalAcademicYear;
  student: PortalStudent;
  summary: PortalSummary;
  todayClasses: Array<Record<string, unknown>>;
  recentAttendance: Array<Record<string, unknown>>;
  upcomingHomework: Array<Record<string, unknown>>;
  upcomingExams: Array<Record<string, unknown>>;
  latestResults: Array<Record<string, unknown>>;
  fees: {
    summary: { totalDue: number; paid: number; balance: number; overdue: number };
    items: Array<Record<string, unknown>>;
  };
  notices: Array<Record<string, unknown>>;
};

export type ParentPortalResponse = {
  role: "parent";
  academicYear: PortalAcademicYear;
  children: PortalStudent[];
  selectedChild: PortalStudent | null;
  summary: PortalSummary | null;
  todayClasses: Array<Record<string, unknown>>;
  attendance: Array<Record<string, unknown>>;
  upcomingHomework: Array<Record<string, unknown>>;
  upcomingExams: Array<Record<string, unknown>>;
  fees: Array<Record<string, unknown>>;
  notices: Array<Record<string, unknown>>;
};
