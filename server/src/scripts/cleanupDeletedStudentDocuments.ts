import { connectDB, disconnectDB } from "../config/db.js";
import { Student } from "../models/index.js";
import { deleteFromR2 } from "../services/r2.js";

const BATCH_SIZE = 100;

async function cleanup(): Promise<void> {
  await connectDB();
  const now = new Date();
  let processed = 0;
  let deleted = 0;
  let failed = 0;

  try {
    const students = await Student.find({
      "documents": {
        $elemMatch: {
          status: "pending_deletion",
          deletionScheduledAt: { $lte: now }
        }
      }
    }).limit(BATCH_SIZE);

    for (const student of students) {
      let changed = false;
      for (const document of student.documents) {
        if (document.status !== "pending_deletion" || !document.deletionScheduledAt || document.deletionScheduledAt > now) continue;
        processed++;
        try {
          await deleteFromR2(document.url);
          student.documents = student.documents.filter((item) => item._id.toString() !== document._id.toString()) as typeof student.documents;
          changed = true;
          deleted++;
          console.log(`[document-cleanup] permanently deleted ${student._id}/${document._id} (${document.url})`);
        } catch (error) {
          failed++;
          console.error(`[document-cleanup] failed to delete ${student._id}/${document._id}:`, error);
        }
      }
      if (changed) await student.save();
    }
  } finally {
    await disconnectDB();
  }

  console.log(JSON.stringify({ processed, deleted, failed, batchSize: BATCH_SIZE }));
  if (failed > 0) process.exitCode = 1;
}

cleanup().catch(async (error) => {
  console.error("[document-cleanup] fatal error:", error);
  try { await disconnectDB(); } catch {}
  process.exit(1);
});
