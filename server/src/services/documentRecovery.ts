import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { env, assertR2Configured } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function getB2Client(): S3Client {
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APPLICATION_KEY || !env.B2_BUCKET_NAME) throw AppError.internal("B2 recovery storage is not configured");
  return new S3Client({ region: "auto", endpoint: env.B2_ENDPOINT, credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY } });
}

function getR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({ region: "auto", endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! } });
}

export function buildRecoveryKey(storageKey: string, deletedAt = new Date()): string {
  const iso = deletedAt.toISOString().replace(/[:.]/g, "");
  const nonce = Math.random().toString(36).slice(2, 12);
  return `recovery/r2-deleted/${iso}-${nonce}/${storageKey.replace(/^\/+/, "")}`;
}

export async function copyR2ObjectToRecovery(storageKey: string, recoveryKey: string): Promise<void> {
  const source = await getR2Client().send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: storageKey }));
  if (!source.Body) throw AppError.notFound("Current R2 document was not found");
  await getB2Client().send(new PutObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey, Body: source.Body as Readable, ContentType: source.ContentType, ContentLength: source.ContentLength, Metadata: { "school-erp-source-key": storageKey, "school-erp-source": "r2-deletion-recovery" } }));
}

/** Prefer the current B2 mirror, but fall back to R2 for newly uploaded files. */
export async function copyB2ObjectToRecovery(storageKey: string, recoveryKey: string): Promise<void> {
  try {
    const source = `${env.B2_BUCKET_NAME!}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
    await getB2Client().send(new CopyObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey, CopySource: source, MetadataDirective: "REPLACE", Metadata: { "school-erp-source-key": storageKey, "school-erp-source": "b2-recovery-copy" } }));
  } catch (error) {
    console.warn("[B2] Current backup copy unavailable; preserving recovery snapshot directly from R2", error);
    await copyR2ObjectToRecovery(storageKey, recoveryKey);
  }
}

export async function backupR2ToB2(): Promise<{ objectCount: number; bytes: number }> {
  const r2 = getR2Client(); const b2 = getB2Client();
  let continuationToken: string | undefined; let objectCount = 0; let bytes = 0;
  do {
    const page = await r2.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME!, ContinuationToken: continuationToken }));
    for (const item of page.Contents || []) {
      if (!item.Key) continue;
      const source = await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: item.Key }));
      if (!source.Body) continue;
      await b2.send(new PutObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: item.Key, Body: source.Body as Readable, ContentType: source.ContentType, ContentLength: source.ContentLength }));
      objectCount += 1; bytes += Number(source.ContentLength ?? item.Size ?? 0);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return { objectCount, bytes };
}

export async function getB2Object(recoveryKey: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const result = await getB2Client().send(new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
  if (!result.Body) throw AppError.notFound("Recovery file not found");
  return { body: result.Body as Readable, contentType: result.ContentType, contentLength: result.ContentLength };
}

export async function getB2RecoverySignedUrl(recoveryKey: string, expiresIn = 600): Promise<string> { return getSignedUrl(getB2Client(), new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }), { expiresIn }); }
export async function deleteB2RecoveryObject(recoveryKey: string): Promise<void> { await getB2Client().send(new DeleteObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey })); }
