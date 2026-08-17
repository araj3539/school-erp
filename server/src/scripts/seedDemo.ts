import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/index.js";

const DEMO_SCHOOL_ID = new mongoose.Types.ObjectId("66c000000000000000000001");
const DEMO_ACADEMIC_YEAR_ID = new mongoose.Types.ObjectId("66c000000000000000000002");
const DEMO_ADMIN_ID = new mongoose.Types.ObjectId("66c000000000000000000003");

async function seedDemo(): Promise<void> {
  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB database connection is not available");
  }

  const passwordHash = await bcrypt.hash("password123", 12);
  const now = new Date();
  const startDate = new Date("2026-04-01T00:00:00.000Z");
  const endDate = new Date("2027-03-31T23:59:59.999Z");

  await db.collection("schools").updateOne(
    { _id: DEMO_SCHOOL_ID },
    {
      $set: {
        name: "Demo School",
        address: "Demo School Campus",
        phone: "9999999999",
        email: "demo@school.com",
        session: "2026-27",
        academicYear: DEMO_ACADEMIC_YEAR_ID,
        settings: {},
        updatedAt: now
      },
      $setOnInsert: { _id: DEMO_SCHOOL_ID, createdAt: now }
    },
    { upsert: true }
  );

  await db.collection("academicyears").updateOne(
    { _id: DEMO_ACADEMIC_YEAR_ID },
    {
      $set: {
        name: "2026-27",
        startDate,
        endDate,
        isCurrent: true,
        schoolId: DEMO_SCHOOL_ID,
        updatedAt: now
      },
      $setOnInsert: { _id: DEMO_ACADEMIC_YEAR_ID, createdAt: now }
    },
    { upsert: true }
  );

  await db.collection("users").updateOne(
    { _id: DEMO_ADMIN_ID },
    {
      $set: {
        email: "admin@school.com",
        passwordHash,
        role: "super_admin",
        schoolId: DEMO_SCHOOL_ID,
        isActive: true,
        updatedAt: now
      },
      $setOnInsert: { _id: DEMO_ADMIN_ID, createdAt: now }
    },
    { upsert: true }
  );

  console.log("Demo data seeded successfully.");
  console.log("Email: admin@school.com");
  console.log("Password: password123");
}

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
