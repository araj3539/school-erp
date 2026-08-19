import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, assertR2Configured } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { Readable } from "node:stream";

function getClient(): S3Client {
  assertR2Configured();
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APPLICATION_KEY || !env.B2_BUCKET_NAME) {
    throw AppError.internal("B2 recovery storage is not configured");
  }
  return new S3Client({
    region: "auto",
    endpoint: env.B2_ENDPOINT,
    credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY }
  });
}

export function buildRecoveryKey(storageKey: string, deletedAt: Date): string {
  const iso = deletedAt.toISOString().replace(/[:.]/g, "");
  return `recovery/r2-deleted/${iso}/${storageKey.replace(/^\/+/, "")}`;
}

export async function copyB2ObjectToRecovery(storageKey: string, recoveryKey: string): Promise<void> {
  // B2 supports server-side copy through the S3-compatible CopyObject API, but the AWS SDK command
  // requires an existing source in the same bucket. We retain the source in B2 and create an isolated recovery object.
  const client = getClient();
  const source = `${env.B2_BUCKET_NAME!}/${storageKey}`;
  const get = await client.send(new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: storageKey }));
  if (!get.Body) throw AppError.internal("B2 backup object has no body");
  const body = get.Body as Readable | Uint8Array | string;
  await client.send(new PutObjectCommand({
    Bucket: env.B2_BUCKET_NAME!,
    Key: recoveryKey,
    Body: body,
    ContentType: get.ContentType,
    Metadata: { "x-school-erp-source-key": storageKey, "x-school-erp-source": source }
  }));
}

export async function getB2Object(recoveryKey: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const client = getClient();
  const result = await client.send(new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
  if (!result.Body) throw AppError.notFound("Recovery file not found");
  return { body: result.Body as Readable, contentType: result.ContentType, contentLength: result.ContentLength };
}

export async function deleteB2RecoveryObject(recoveryKey: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
}
