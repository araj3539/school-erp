import { AcademicYear, Attendance, ExamResult, Student, StudentBehaviour } from "../models/index.js";
import { getTenantId } from "../utils/tenant.js";

export type RiskLevel = "watch" | "intervention";
export interface AtRiskStudent {
  student: any;
  score: number;
  level: RiskLevel;
  factors: string[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export async function getAtRiskStudents(req: Request): Promise<{ academicYear: any; students: AtRiskStudent[] }> {
  const schoolId = getTenantId(req);
  const academicYear = await AcademicYear.findOne({ schoolId, isCurrent: true }).select("_id name startDate endDate").lean();
  if (!academicYear) return { academicYear: null, students: [] };

  const students = await Student.find({ schoolId, status: "active" })
    .select("_id admissionNo firstName lastName classId sectionId")
    .populate("classId sectionId")
    .lean();
  if (!students.length) return { academicYear, students: [] };

  const studentIds = students.map((student) => student._id);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [attendance, results, behaviour] = await Promise.all([
    Attendance.find({ schoolId, "records.studentId": { $in: studentIds }, date: { $gte: since, $lte: new Date() } })
      .select("date records.studentId records.status").lean(),
    ExamResult.find({ schoolId, academicYearId: academicYear._id, studentId: { $in: studentIds }, status: "published" })
      .select("studentId percentage result").lean(),
    StudentBehaviour.find({ schoolId, studentId: { $in: studentIds }, kind: "incident", status: "open", occurredAt: { $gte: since } })
      .select("studentId severity").lean()
  ]);

  const attendanceByStudent = new Map<string, { total: number; present: number }>();
  for (const item of attendance as any[]) {
    for (const record of item.records ?? []) {
      const id = record.studentId.toString();
      if (!studentIds.some((student) => student._id.toString() === id)) continue;
      const current = attendanceByStudent.get(id) ?? { total: 0, present: 0 };
      current.total += 1;
      if (record.status === "present") current.present += 1;
      attendanceByStudent.set(id, current);
    }
  }

  const resultsByStudent = new Map<string, any[]>();
  for (const result of results as any[]) {
    const id = result.studentId.toString();
    const list = resultsByStudent.get(id) ?? [];
    list.push(result);
    resultsByStudent.set(id, list);
  }
  const behaviourByStudent = new Map<string, any[]>();
  for (const item of behaviour as any[]) {
    const id = item.studentId.toString();
    const list = behaviourByStudent.get(id) ?? [];
    list.push(item);
    behaviourByStudent.set(id, list);
  }

  const scored = students.map((student) => {
    const id = student._id.toString();
    const factors: string[] = [];
    let score = 0;
    const attendanceStats = attendanceByStudent.get(id);
    if (attendanceStats?.total) {
      const rate = Math.round((attendanceStats.present / attendanceStats.total) * 100);
      if (rate < 75) { score += 30; factors.push(`Attendance ${rate}% (below 75%)`); }
      else if (rate < 85) { score += 15; factors.push(`Attendance ${rate}% (below 85%)`); }
    }
    const studentResults = resultsByStudent.get(id) ?? [];
    if (studentResults.some((result) => result.result === "fail")) { score += 25; factors.push("At least one published failed result"); }
    if (studentResults.length) {
      const average = studentResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / studentResults.length;
      if (average < 50) { score += 20; factors.push(`Published result average ${Math.round(average)}%`); }
      else if (average < 65) { score += 10; factors.push(`Published result average ${Math.round(average)}%`); }
    }
    const incidents = behaviourByStudent.get(id) ?? [];
    const high = incidents.filter((item) => item.severity === "high").length;
    const medium = incidents.filter((item) => item.severity === "medium").length;
    if (high) { score += 20; factors.push(`${high} open high-severity behaviour incident${high > 1 ? "s" : ""}`); }
    else if (medium) { score += 10; factors.push(`${medium} open medium-severity behaviour incident${medium > 1 ? "s" : ""}`); }
    score = clamp(score);
    return { student, score, level: "watch" as RiskLevel, factors };
  }).filter((item) => item.score >= 25);

  return {
    academicYear,
    students: scored
      .map((item) => ({ ...item, level: item.score >= 50 ? "intervention" : "watch" }))
      .sort((a, b) => b.score - a.score)
  };
}
