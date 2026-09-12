import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, "../../.env"));
try { loadEnvFile(resolve(__dirname, "../../../.env")); } catch { /* optional */ }

const { connectDB, disconnectDB } = await import("../config/index.js");
const { Student, Fee, AcademicYear } = await import("../models/index.js");

async function assertNoDuplicates(model: any, groupId: Record<string, string>, label: string, match?: Record<string, unknown>) {
  const pipeline: any[] = [];
  if (match) pipeline.push({ $match: match });
  pipeline.push({ $group: { _id: groupId, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }, { $limit: 1 });
  if ((await model.aggregate(pipeline)).length) throw new Error(`${label} contains duplicate records; migration aborted`);
}

async function dropIfPresent(collection: any, name: string) {
  const indexes = await collection.indexes();
  if (indexes.some((index: any) => index.name === name)) await collection.dropIndex(name);
}

async function ensureIndex(collection: any, key: Record<string, 1 | -1>, options: Record<string, unknown>) {
  const indexes = await collection.indexes();
  const existing = indexes.find((index: any) => index.name === options.name);
  if (!existing) await collection.createIndex(key, options);
}

async function main(): Promise<void> {
  await connectDB();
  try {
    await assertNoDuplicates(Student, { schoolId: "$schoolId", admissionNo: "$admissionNo" }, "Student admission numbers");
    await assertNoDuplicates(Fee, { schoolId: "$schoolId", studentId: "$studentId", feeStructureId: "$feeStructureId", academicYear: "$academicYear" }, "Fee records");
    await assertNoDuplicates(AcademicYear, { schoolId: "$schoolId" }, "Current academic years", { isCurrent: true });

    // The old student/global and academic-year/current indexes are superseded. Keep the
    // existing fee status index because it still serves outstanding-fee queries.
    await dropIfPresent(Student.collection, "admissionNo_1");
    await dropIfPresent(AcademicYear.collection, "schoolId_1_isCurrent_1");

    await ensureIndex(Student.collection, { schoolId: 1, admissionNo: 1 }, { unique: true, name: "schoolId_1_admissionNo_1" });
    await ensureIndex(Fee.collection, { schoolId: 1, studentId: 1, feeStructureId: 1, academicYear: 1 }, { unique: true, name: "schoolId_1_studentId_1_feeStructureId_1_academicYear_1" });
    await ensureIndex(AcademicYear.collection, { schoolId: 1, isCurrent: 1 }, { unique: true, partialFilterExpression: { isCurrent: true }, name: "schoolId_1_isCurrent_true_unique" });

    console.log("Core integrity indexes verified");
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  console.error("Core integrity migration failed:", error);
  process.exitCode = 1;
});
