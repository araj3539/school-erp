import { connectDB, disconnectDB } from "../config/db.js";
import { Student } from "../models/index.js";
import { listR2Keys } from "../services/r2.js";

async function report(): Promise<void> {
  await connectDB();
  try {
    const [r2Keys, students] = await Promise.all([
      listR2Keys("students/"),
      Student.find({}).select("documents").lean()
    ]);

    const referenced = new Set<string>();
    for (const student of students) {
      for (const document of student.documents || []) {
        if (document.url) referenced.add(document.url);
      }
    }

    const orphaned = r2Keys.filter((key) => !referenced.has(key));
    console.log(JSON.stringify({
      scannedR2Objects: r2Keys.length,
      referencedObjects: referenced.size,
      orphanedObjects: orphaned.length,
      orphanedKeys: orphaned.slice(0, 100),
      truncated: orphaned.length > 100
    }, null, 2));
  } finally {
    await disconnectDB();
  }
}

report().catch(async (error) => {
  console.error("[orphan-report] fatal error:", error);
  try { await disconnectDB(); } catch {}
  process.exit(1);
});
