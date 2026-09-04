import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";
import { env, assertR2Configured } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const RECOVERY_PREFIX = "recovery/r2-deleted/";
const METADATA_PREFIX = "metadata/";
const DATABASE_PREFIX = "database/";
const PRESERVED_PREFIXES = [RECOVERY_PREFIX, METADATA_PREFIX, DATABASE_PREFIX];
const SOURCE_ETAG_METADATA_KEY = "school-erp-source-etag";

type B2VersionRef = { Key: string; VersionId: string };
type BackupResult = { objectCount: number; bytes: number; deletedCount: number };

let backupInProgress: Promise<BackupResult> | null = null;

function getB2Client(): S3Client {
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APPLICATION_KEY || !env.B2_BUCKET_NAME) throw AppError.internal("B2 recovery storage is not configured");
  return new S3Client({ region: "auto", endpoint: env.B2_ENDPOINT, credentials: { accessKeyId: env.B2_KEY_ID, secretAccessKey: env.B2_APPLICATION_KEY } });
}

function getR2Client(): S3Client {
  assertR2Configured();
  return new S3Client({ region: "auto", endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! } });
}

function isProtectedB2Key(key: string): boolean {
  return PRESERVED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function normalizeEtag(etag?: string): string | undefined {
  return etag?.replace(/^"|"$/g, "");
}

async function deleteB2Versions(b2: S3Client, bucket: string, objects: B2VersionRef[]): Promise<void> {
  for (let i = 0; i < objects.length; i += 1000) {
    const chunk = objects.slice(i, i + 1000);
    if (!chunk.length) continue;
    const result = await b2.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: chunk, Quiet: true } }));
    if (result.Errors?.length) {
      const details = result.Errors.slice(0, 5).map((error) => `${error.Key ?? "unknown"} (${error.VersionId ?? "unknown"}): ${error.Code ?? "unknown"}`).join(", ");
      throw AppError.internal(`Failed to permanently delete B2 object versions: ${details}`);
    }
  }
}

/** Permanently removes every non-current B2 version and every version of keys no longer present in R2. */
async function purgeB2Versions(b2: S3Client, bucket: string, currentKeys: Set<string>): Promise<number> {
  let keyMarker: string | undefined;
  let versionIdMarker: string | undefined;
  const stale: B2VersionRef[] = [];
  const removedKeys = new Set<string>();

  do {
    const page = await b2.send(new ListObjectVersionsCommand({
      Bucket: bucket,
      KeyMarker: keyMarker,
      VersionIdMarker: versionIdMarker,
      MaxKeys: 1000,
    }));

    for (const version of page.Versions ?? []) {
      if (!version.Key || !version.VersionId) continue;
      const keepCurrent = currentKeys.has(version.Key) || isProtectedB2Key(version.Key);
      if (!keepCurrent || !version.IsLatest) {
        stale.push({ Key: version.Key, VersionId: version.VersionId });
        if (!keepCurrent) removedKeys.add(version.Key);
      }
    }

    for (const marker of page.DeleteMarkers ?? []) {
      if (!marker.Key || !marker.VersionId) continue;
      const keepCurrent = currentKeys.has(marker.Key) || isProtectedB2Key(marker.Key);
      if (!keepCurrent || !marker.IsLatest) {
        stale.push({ Key: marker.Key, VersionId: marker.VersionId });
        if (!keepCurrent) removedKeys.add(marker.Key);
      }
    }

    keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
    versionIdMarker = page.IsTruncated ? page.NextVersionIdMarker : undefined;
  } while (keyMarker);

  await deleteB2Versions(b2, bucket, stale);
  return removedKeys.size;
}

async function deleteAllVersionsForExactB2Key(b2: S3Client, bucket: string, key: string): Promise<void> {
  let keyMarker: string | undefined;
  let versionIdMarker: string | undefined;
  const versions: B2VersionRef[] = [];

  do {
    const page = await b2.send(new ListObjectVersionsCommand({
      Bucket: bucket,
      Prefix: key,
      KeyMarker: keyMarker,
      VersionIdMarker: versionIdMarker,
      MaxKeys: 1000,
    }));

    for (const version of page.Versions ?? []) {
      if (version.Key === key && version.VersionId) versions.push({ Key: key, VersionId: version.VersionId });
    }
    for (const marker of page.DeleteMarkers ?? []) {
      if (marker.Key === key && marker.VersionId) versions.push({ Key: key, VersionId: marker.VersionId });
    }

    keyMarker = page.IsTruncated ? page.NextKeyMarker : undefined;
    versionIdMarker = page.IsTruncated ? page.NextVersionIdMarker : undefined;
  } while (keyMarker);

  await deleteB2Versions(b2, bucket, versions);
}

export function buildRecoveryKey(storageKey: string, deletedAt = new Date()): string {
  const iso = deletedAt.toISOString().replace(/[:.]/g, "");
  const nonce = Math.random().toString(36).slice(2, 12);
  return `${RECOVERY_PREFIX}${iso}-${nonce}/${storageKey.replace(/^\/+/, "")}`;
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
    console.warn("[B2] Current mirror copy unavailable; preserving recovery snapshot directly from R2", error);
    await copyR2ObjectToRecovery(storageKey, recoveryKey);
  }
}

async function runBackupR2ToB2(): Promise<BackupResult> {
  const r2 = getR2Client();
  const b2 = getB2Client();
  const currentKeys = new Set<string>();
  let continuationToken: string | undefined;
  let objectCount = 0;
  let bytes = 0;

  do {
    const page: { Contents?: _Object[]; IsTruncated?: boolean; NextContinuationToken?: string } = await r2.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME!, ContinuationToken: continuationToken }));
    for (const item of page.Contents || []) {
      if (!item.Key) continue;
      currentKeys.add(item.Key);

      const sourceEtag = normalizeEtag(item.ETag);
      let needsUpload = true;
      try {
        const existing = await b2.send(new HeadObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: item.Key }));
        const sourceSize = Number(item.Size ?? 0);
        const destinationSize = Number(existing.ContentLength ?? -1);
        const storedSourceEtag = normalizeEtag(existing.Metadata?.[SOURCE_ETAG_METADATA_KEY]);

        // Compare the R2 ETag that was captured at the time of the last upload,
        // rather than comparing R2's ETag with B2's own provider-specific ETag.
        // Missing metadata intentionally triggers one migration upload so every
        // mirrored object is brought onto the stronger comparison scheme.
        needsUpload = destinationSize !== sourceSize || !sourceEtag || storedSourceEtag !== sourceEtag;
      } catch {
        needsUpload = true;
      }

      if (!needsUpload) {
        objectCount += 1;
        bytes += Number(item.Size ?? 0);
        continue;
      }

      const source = await r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME!, Key: item.Key }));
      if (!source.Body) continue;
      await b2.send(new PutObjectCommand({
        Bucket: env.B2_BUCKET_NAME!,
        Key: item.Key,
        Body: source.Body as Readable,
        ContentType: source.ContentType,
        ContentLength: source.ContentLength,
        Metadata: {
          [SOURCE_ETAG_METADATA_KEY]: sourceEtag ?? "",
        },
      }));
      objectCount += 1;
      bytes += Number(source.ContentLength ?? item.Size ?? 0);
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  const deletedCount = await purgeB2Versions(b2, env.B2_BUCKET_NAME!, currentKeys);
  return { objectCount, bytes, deletedCount };
}

/** Serialize manual backups so two simultaneous requests cannot create competing mirror versions. */
export async function backupR2ToB2(): Promise<BackupResult> {
  if (backupInProgress) return backupInProgress;

  const operation = runBackupR2ToB2();
  backupInProgress = operation;
  try {
    return await operation;
  } finally {
    if (backupInProgress === operation) backupInProgress = null;
  }
}

export async function getB2Object(recoveryKey: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const result = await getB2Client().send(new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }));
  if (!result.Body) throw AppError.notFound("Recovery file not found");
  return { body: result.Body as Readable, contentType: result.ContentType, contentLength: result.ContentLength };
}

export async function getB2RecoverySignedUrl(recoveryKey: string, expiresIn = 600): Promise<string> { return getSignedUrl(getB2Client(), new GetObjectCommand({ Bucket: env.B2_BUCKET_NAME!, Key: recoveryKey }), { expiresIn }); }
export async function deleteB2RecoveryObject(recoveryKey: string): Promise<void> { await deleteAllVersionsForExactB2Key(getB2Client(), env.B2_BUCKET_NAME!, recoveryKey); }
