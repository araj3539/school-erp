import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env, assertR2Configured } from "../config/env.js";

function getR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<{ key: string }> {
  const client = getR2Client();
  await client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return { key };
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key }));
}

export async function getR2SignedUrl(key: string, expiresIn = 600): Promise<string> {
  const client = getR2Client();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: key }), { expiresIn });
}

export async function listR2Keys(prefix?: string): Promise<string[]> {
  const client = getR2Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await client.send(new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME!,
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));
    for (const object of response.Contents || []) if (object.Key) keys.push(object.Key);
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

export function buildR2Key(parts: string[]): string {
  return parts.filter(Boolean).map((part) => part.replace(/^\/+|\/+$/g, "")).join("/");
}

export function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize("NFKC");
  const cleaned = normalized.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "file";
}
