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
      documents: {
        $elemMatch: {
          status: "pending_deletion",
          deletionScheduledAt: { $lte: now }
        }
      }
    }).limit(BATCH_SIZE);

    for (const student of students) {
      const eligible = student.documents.filter(
        (document) => document.status === "pending_deletion" && document.deletionScheduledAt && document.deletionScheduledAt <= now
      );
      const successfullyDeleted = new Set<string>();

      for (const document of eligible) {
        processed++;
        try {
          await deleteFromR2(document.url);
          successfullyDeleted.add(document._id.toString());
          deleted++;
          console.log(`[document-cleanup] permanently deleted ${student._id}/${document._id} (${document.url})`);
        } catch (error) {
          failed++;
          console.error(`[document-cleanup] failed to delete ${student._id}/${document._id}:`, error);
        }
      }

      if (successfullyDeleted.size > 0) {
        student.documents = student.documents.filter((document) => !successfullyDeleted.has(document._id.toString())) as typeof student.documents;
        await student.save();
      }
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
