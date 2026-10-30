export { examsService } from "./exams.js";
export { resultTemplatesService } from "./resultTemplates.js";
export { studentsService } from "./students.js";
export { feesService } from "./fees.js";
export { attendanceService } from "./attendance.js";
export { teachersService } from "./teachers.js";
export { reportsService } from "./reports.js";
export { authService } from "./auth.js";
export { modulesService } from "./modules.js";

export type {
  Exam,
  CreateExamInput,
  UpdateExamInput,
  ExamResult,
  PublishExamInput,
  BulkPublishInput,
  BulkPublishResult,
  ExamQueryParams,
  MarksEntry,
} from "./exams.js";

export type {
  ResultTemplate,
  CreateResultTemplateInput,
  UpdateResultTemplateInput,
  ResultTemplateQueryParams,
} from "./resultTemplates.js";

export type {
  Student,
  CreateStudentInput,
  StudentQueryParams,
} from "./students.js";

export type { Fee, FeeQueryParams } from "./fees.js";
export type { AttendanceRecord, AttendanceQueryParams, AttendanceListData } from "./attendance.js";
export type { Teacher, CreateTeacherInput, UpdateTeacherInput, TeacherQueryParams } from "./teachers.js";
export type { ReportExportParams, ReportExportResult } from "./reports.js";
export type { User, School, AuthResponse } from "./auth.js";
export type { ModuleEntitlement } from "./modules.js";
