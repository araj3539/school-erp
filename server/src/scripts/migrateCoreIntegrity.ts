import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch { /* optional */ }

const { connectDB, disconnectDB } = await import("../config/index.js");
const { Student, Fee, AcademicYear } = await import("../models/index.js");

async function assertNoDuplicates(model: any, groupId: Record<string, string>, label: string) {
  const duplicates = await model.aggregate([
    { $group: { _id: groupId, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicates.length) throw new Error(`${label} contains duplicate records; migration aborted`);
}

async function main(): Promise<void> {
  await connectDB();
  try {
    await assertNoDuplicates(Student, { schoolId: "$schoolId", admissionNo: "$admissionNo" }, "Student admission numbers");
    await assertNoDuplicates(Fee, { schoolId: "$schoolId", studentId: "$studentId", feeStructureId: "$feeStructureId", academicYear: "$academicYear" }, "Fee records");
    await assertNoDuplicates(AcademicYear, { schoolId: "$schoolId", isCurrent: "$isCurrent" }, "Academic years");

    await Student.collection.dropIndex("admissionNo_1").catch((error: any) => {
      if (error?.codeName !== "IndexNotFound" && error?.code !== 27) throw error;
    });
    await Fee.collection.dropIndex("schoolId_1_studentId_1_academicYear_1_status_1").catch((error: any) => {
      if (error?.codeName !== "IndexNotFound" && error?.code !== 27) throw error;
    });
    await AcademicYear.collection.dropIndex("schoolId_1_isCurrent_1").catch((error: any) => {
      if (error?.codeName !== "IndexNotFound" && error?.code !== 27) throw error;
    });

    await Student.collection.createIndex(
      { schoolId: 1, admissionNo: 1 },
      { unique: true, name: "schoolId_1_admissionNo_1" },
    );
    await Fee.collection.createIndex(
      { schoolId: 1, studentId: 1, feeStructureId: 1, academicYear: 1 },
      { unique: true, name: "schoolId_1_studentId_1_feeStructureId_1_academicYear_1" },
    );
    await AcademicYear.collection.createIndex(
      { schoolId: 1, isCurrent: 1 },
      { unique: true, partialFilterExpression: { isCurrent: true }, name: "schoolId_1_isCurrent_true_unique" },
    );

    console.log("Core integrity indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Core integrity migration failed:", error);
  process.exitCode = 1;
});
