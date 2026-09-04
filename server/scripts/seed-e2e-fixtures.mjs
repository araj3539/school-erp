import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const REQUIRED_FLAG = "true";
if (process.env.NODE_ENV === "production" || process.env.E2E_FIXTURE_SEED_ENABLED !== REQUIRED_FLAG) {
  throw new Error("E2E fixture seeding is disabled. Set E2E_FIXTURE_SEED_ENABLED=true and never run it against production.");
}

const mongoUri = process.env.MONGODB_URI;
const password = process.env.E2E_FIXTURE_PASSWORD;
if (!mongoUri) throw new Error("MONGODB_URI is required");
if (!password || password.length < 12) throw new Error("E2E_FIXTURE_PASSWORD must be set and contain at least 12 characters");

const ids = {
  schoolA: new mongoose.Types.ObjectId("67e000000000000000000001"),
  schoolB: new mongoose.Types.ObjectId("67e000000000000000000002"),
  yearA: new mongoose.Types.ObjectId("67e000000000000000000011"),
  yearB: new mongoose.Types.ObjectId("67e000000000000000000012"),
  classA: new mongoose.Types.ObjectId("67e000000000000000000021"),
  classB: new mongoose.Types.ObjectId("67e000000000000000000022"),
  sectionA: new mongoose.Types.ObjectId("67e000000000000000000031"),
  sectionB: new mongoose.Types.ObjectId("67e000000000000000000032"),
  principalA: new mongoose.Types.ObjectId("67e000000000000000000041"),
  teacherA: new mongoose.Types.ObjectId("67e000000000000000000042"),
  studentUserA1: new mongoose.Types.ObjectId("67e000000000000000000043"),
  studentUserA2: new mongoose.Types.ObjectId("67e000000000000000000044"),
  parentA: new mongoose.Types.ObjectId("67e000000000000000000045"),
  principalB: new mongoose.Types.ObjectId("67e000000000000000000046"),
  studentUserB: new mongoose.Types.ObjectId("67e000000000000000000047"),
  studentA1: new mongoose.Types.ObjectId("67e000000000000000000051"),
  studentA2: new mongoose.Types.ObjectId("67e000000000000000000052"),
  studentB: new mongoose.Types.ObjectId("67e000000000000000000053")
};

const now = new Date();
const startDate = new Date("2026-04-01T00:00:00.000Z");
const endDate = new Date("2027-03-31T23:59:59.999Z");
const passwordHash = await bcrypt.hash(password, 12);

const schools = [
  { _id: ids.schoolA, code: "SCH-E2E-A", name: "E2E School A", address: "E2E Fixture Campus A", phone: "9000000001", email: "e2e-school-a@example.com", session: "2026-27", academicYear: ids.yearA },
  { _id: ids.schoolB, code: "SCH-E2E-B", name: "E2E School B", address: "E2E Fixture Campus B", phone: "9000000002", email: "e2e-school-b@example.com", session: "2026-27", academicYear: ids.yearB }
];

const academicYears = [
  { _id: ids.yearA, name: "2026-27", startDate, endDate, isCurrent: true, schoolId: ids.schoolA },
  { _id: ids.yearB, name: "2026-27", startDate, endDate, isCurrent: true, schoolId: ids.schoolB }
];

const classes = [
  { _id: ids.classA, name: "8", displayName: "Class 8", schoolId: ids.schoolA, sectionIds: [ids.sectionA], capacity: 40 },
  { _id: ids.classB, name: "8", displayName: "Class 8", schoolId: ids.schoolB, sectionIds: [ids.sectionB], capacity: 40 }
];

const sections = [
  { _id: ids.sectionA, name: "A", classId: ids.classA, schoolId: ids.schoolA, capacity: 40 },
  { _id: ids.sectionB, name: "A", classId: ids.classB, schoolId: ids.schoolB, capacity: 40 }
];

const users = [
  [ids.principalA, "principal.e2e.a@example.com", "principal", ids.schoolA],
  [ids.teacherA, "teacher.e2e.a@example.com", "teacher", ids.schoolA],
  [ids.studentUserA1, "student.e2e.a1@example.com", "student", ids.schoolA],
  [ids.studentUserA2, "student.e2e.a2@example.com", "student", ids.schoolA],
  [ids.parentA, "parent.e2e.a@example.com", "parent", ids.schoolA],
  [ids.principalB, "principal.e2e.b@example.com", "principal", ids.schoolB],
  [ids.studentUserB, "student.e2e.b@example.com", "student", ids.schoolB]
].map(([id, email, role, schoolId]) => ({
  _id: id,
  email,
  passwordHash,
  role,
  schoolId,
  isActive: true,
  refreshTokenVersion: 0,
  updatedAt: now,
  createdAt: now
}));

const students = [
  { _id: ids.studentA1, admissionNo: "E2E-A-001", userId: ids.studentUserA1, parentIds: [ids.parentA], schoolId: ids.schoolA, classId: ids.classA, sectionId: ids.sectionA, firstName: "Aarav", lastName: "Fixture", dob: new Date("2013-05-10T00:00:00.000Z"), gender: "male", fatherName: "Parent A", motherName: "Parent A Mother", phone: "9000000011", address: "E2E Fixture Address A1", status: "active", admissionDate: startDate, documents: [], createdAt: now, updatedAt: now },
  { _id: ids.studentA2, admissionNo: "E2E-A-002", userId: ids.studentUserA2, parentIds: [ids.parentA], schoolId: ids.schoolA, classId: ids.classA, sectionId: ids.sectionA, firstName: "Anaya", lastName: "Fixture", dob: new Date("2013-08-15T00:00:00.000Z"), gender: "female", fatherName: "Parent A", motherName: "Parent A Mother", phone: "9000000012", address: "E2E Fixture Address A2", status: "active", admissionDate: startDate, documents: [], createdAt: now, updatedAt: now },
  { _id: ids.studentB, admissionNo: "E2E-B-001", userId: ids.studentUserB, parentIds: [], schoolId: ids.schoolB, classId: ids.classB, sectionId: ids.sectionB, firstName: "Vihaan", lastName: "Fixture", dob: new Date("2013-11-20T00:00:00.000Z"), gender: "male", fatherName: "Parent B", motherName: "Parent B Mother", phone: "9000000021", address: "E2E Fixture Address B1", status: "active", admissionDate: startDate, documents: [], createdAt: now, updatedAt: now }
];

const teachers = [{
  _id: ids.teacherA,
  employeeId: "E2E-TEACHER-A",
  userId: ids.teacherA,
  schoolId: ids.schoolA,
  firstName: "Teacher",
  lastName: "Fixture",
  email: "teacher.e2e.a@example.com",
  phone: "9000000031",
  qualification: "B.Ed",
  experience: 5,
  joiningDate: startDate,
  salary: 0,
  subjects: [],
  classTeacherOf: [ids.classA],
  documents: [],
  status: "active",
  createdAt: now,
  updatedAt: now
}];

const upsertMany = async (collection, documents) => {
  for (const document of documents) {
    const { _id, ...set } = document;
    await collection.updateOne({ _id }, { $set: set, $setOnInsert: { _id } }, { upsert: true });
  }
};

try {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB database connection is not available");

  if (process.env.E2E_FIXTURE_RESET === REQUIRED_FLAG) {
    for (const [collection, values] of Object.entries({
      students: [ids.studentA1, ids.studentA2, ids.studentB],
      teachers: [ids.teacherA],
      users: [ids.principalA, ids.teacherA, ids.studentUserA1, ids.studentUserA2, ids.parentA, ids.principalB, ids.studentUserB],
      sections: [ids.sectionA, ids.sectionB],
      classes: [ids.classA, ids.classB],
      academicyears: [ids.yearA, ids.yearB],
      schools: [ids.schoolA, ids.schoolB]
    })) {
      await db.collection(collection).deleteMany({ _id: { $in: values } });
    }
  }

  await upsertMany(db.collection("schools"), schools);
  await upsertMany(db.collection("academicyears"), academicYears);
  await upsertMany(db.collection("classes"), classes);
  await upsertMany(db.collection("sections"), sections);
  await upsertMany(db.collection("users"), users);
  await upsertMany(db.collection("teachers"), teachers);
  await upsertMany(db.collection("students"), students);

  await db.collection("users").updateOne({ _id: ids.teacherA }, { $set: { profileId: ids.teacherA } });
  await db.collection("users").updateOne({ _id: ids.studentUserA1 }, { $set: { profileId: ids.studentA1 } });
  await db.collection("users").updateOne({ _id: ids.studentUserA2 }, { $set: { profileId: ids.studentA2 } });
  await db.collection("users").updateOne({ _id: ids.studentUserB }, { $set: { profileId: ids.studentB } });

  console.log(JSON.stringify({
    message: "Deterministic E2E fixtures seeded",
    schools: schools.map(({ code }) => code),
    multiChildParent: "parent.e2e.a@example.com",
    students: students.map(({ admissionNo }) => admissionNo),
    studentIds: { schoolA1: ids.studentA1.toString(), schoolA2: ids.studentA2.toString(), schoolB1: ids.studentB.toString() }
  }, null, 2));
} finally {
  await mongoose.disconnect();
}
