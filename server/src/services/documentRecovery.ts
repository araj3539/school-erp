import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { env, assertR2Configured } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function getB2Client(): S3Client {
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APPLICATION_KEY || !env.B2_BUCKET_NAME) {
    throw AppError.internal("B2 recovery storage is not configured");
  }
  return new S3Client({
    region: "auto",
    endpoint: env.B2_ENDPOINT,
    credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY }
  });
}

function getR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! }
  });
}

export function buildRecoveryKey(storageKey: string, deletedAt: Date): string {
  const iso = deletedAt.toISOString().replace(/[:.]/g, "");
  const nonce = Math.random().toString(36).slice(2, 10);
  return `recovery/r2-deleted/${iso}-${nonce}/${storageKey.replace(/^\/+/, "")}`;
}

/** Preserve the current R2 object as an immutable recovery snapshot in B2.
 * This intentionally does not overwrite the normal B2 backup key, so every delete/restore/delete event gets its own object.
 */
export async function copyR2ObjectToRecovery(storageKey: string, recoveryKey: string): Promise<void> {
  const r2 = getR2Client();
  const b2 = getB2Client();
  const source = await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: storageKey }));
  if (!source.Body) throw AppError.notFound("Current R2 document was not found");
  await b2.send(new PutObjectCommand({
    Bucket: env.B2_BUCKET_NAME!,
    Key: recoveryKey,
    Body: source.Body as Readable,
    ContentType: source.ContentType,
    ContentLength: source.ContentLength,
    Metadata: {
      "school-erp-source-key": storageKey,
      "school-erp-source": "r2-deletion-recovery"
    }
  }));
}

/** Compatibility helper for a recovery source that already exists in the normal B2 backup namespace. */
export async function copyB2ObjectToRecovery(storageKey: string, recoveryKey: string): Promise<void> {
  const client = getB2Client();
  const source = `${env.B2_BUCKET_NAME!}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
  await client.send(new CopyObjectCommand({
    Bucket: env.B2_BUCKET_NAME!,
    Key: recoveryKey,
    CopySource: source,
    MetadataDirective: "REPLACE",
    Metadata: { "school-erp-source-key": storageKey, "school-erp-source": "b2-recovery-copy" }
  }));
}

export async function getB2Object(recoveryKey: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const client = getB2Client();
  const result = await client.send(new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
  if (!result.Body) throw AppError.notFound("Recovery file not found");
  return { body: result.Body as Readable, contentType: result.ContentType, contentLength: result.ContentLength };
}

export async function getB2RecoverySignedUrl(recoveryKey: string, expiresIn = 600): Promise<string> {
  const client = getB2Client();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }), { expiresIn });
}

export async function deleteB2RecoveryObject(recoveryKey: string): Promise<void> {
  const client = getB2Client();
  await client.send(new DeleteObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
}
