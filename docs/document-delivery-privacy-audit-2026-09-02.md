# School ERP — Document Delivery & Privacy Audit

Review date: 2026-09-02
Baseline: `main` after Phase 3 closure

## Scope

Audit the student-document delivery path after Phase 3, with emphasis on tenant/ownership authorization, storage-key exposure, signed delivery and recovery separation.

## Current storage architecture

- Current document storage is Cloudflare R2 through the S3-compatible client.
- Normal document delivery uses short-lived R2 signed URLs.
- Backblaze B2 is used for recovery/backup infrastructure.
- Legacy Cloudinary references are documentation drift, not the active implementation.

## Findings

### 1. Normal student responses exposed internal storage fields — FIXED

`Student.documents` stores the R2 object key in `url` and may contain the legacy `publicId` field. Normal student list/detail responses did not need either value because document viewing already uses the dedicated signed-URL endpoint.

The student and parent read queries now exclude `documents.url` and `documents.publicId` while retaining document metadata such as type, original name, MIME type, size and upload date.

### 2. Signed document delivery is authorization-gated — VERIFIED

The student document URL endpoint first applies student/parent/teacher ownership checks and the authenticated tenant boundary, then loads the document from the tenant-scoped student and generates a signed URL for 600 seconds.

The parent-specific document URL endpoint independently requires parent role and the linked-child relationship before generating the same short-lived signed delivery.

### 3. Recovery preview remains separately authorized — VERIFIED

Recovery preview uses tenant-scoped recovery lookup and a 600-second B2 signed URL. Recovery keys are not returned in the public recovery representation.

Restore remains restricted to authorized school administrators and records a `RESTORE_DOCUMENT` audit event.

### 4. Recovery access is separated from normal delivery — VERIFIED

Normal document delivery reads the active R2 object. Recovery preview reads the B2 recovery copy. Manual backup and restore remain privileged recovery workflows.

## Verification

Local verification after pulling the GitHub changes:

- server production build: PASS
- client production build: PASS
- Phase 2 document/recovery security suite: 7/7 PASS on the deployed Render API
- direct deployed student-detail response check: HTTP 200; current fixture student has no documents, so the storage-field omission could not be exercised against a populated document record in that fixture

The Phase 2 suite continues to verify cross-tenant and role-boundary denial for document recovery operations.

## Next audit slice

Before moving to dashboard/reporting performance:

1. add a populated-document acceptance fixture or non-destructive test fixture for normal signed delivery;
2. verify authorized student/parent/teacher document URL generation against a real document;
3. verify the signed response does not expose a permanent object URL or recovery key;
4. add document-access audit logging only if the product requires a durable view trail, without recording signed URLs or storage secrets.
