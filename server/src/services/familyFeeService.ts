import { Fee, Student, StudentFamily } from "../models/index.js";
import { AppError } from "../utils/errors.js";

export async function getStudentFamilyFeeSummary(schoolId: string, studentId: string, academicYear?: string) {
  const student = await Student.findOne({ _id: studentId, schoolId }).select("_id firstName lastName admissionNo").lean();
  if (!student) throw AppError.notFound("Student not found");

  const families = await StudentFamily.find({ schoolId, studentIds: studentId }).lean();
  const siblingIds = [...new Set(families.flatMap((family) => family.studentIds.map((id) => id.toString())).filter((id) => id !== studentId))];
  if (siblingIds.length === 0) return { student, families: [], siblings: [] };

  const studentFilter: Record<string, any> = { schoolId, _id: { $in: siblingIds } };
  const feeFilter: Record<string, any> = { schoolId, studentId: { $in: siblingIds } };
  if (academicYear) feeFilter.academicYear = academicYear;

  const [siblings, fees] = await Promise.all([
    Student.find(studentFilter).select("_id admissionNo firstName lastName classId sectionId status").populate("classId", "displayName").populate("sectionId", "name").lean(),
    Fee.find(feeFilter).select("studentId amount discount fine totalDue paidAmount balance status academicYear feeStructureId").lean()
  ]);

  const feeSummary = new Map<string, { feeCount: number; totalDue: number; paidAmount: number; balance: number; pendingCount: number }>();
  for (const fee of fees) {
    const key = fee.studentId.toString();
    const current = feeSummary.get(key) ?? { feeCount: 0, totalDue: 0, paidAmount: 0, balance: 0, pendingCount: 0 };
    current.feeCount += 1;
    current.totalDue += Number(fee.totalDue || 0);
    current.paidAmount += Number(fee.paidAmount || 0);
    current.balance += Number(fee.balance || 0);
    if (Number(fee.balance || 0) > 0) current.pendingCount += 1;
    feeSummary.set(key, current);
  }

  return {
    student,
    families: families.map((family) => ({ _id: family._id, relationship: family.relationship })),
    siblings: siblings.map((sibling: any) => ({
      ...sibling,
      feeSummary: feeSummary.get(sibling._id.toString()) ?? { feeCount: 0, totalDue: 0, paidAmount: 0, balance: 0, pendingCount: 0 }
    }))
  };
}
