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
