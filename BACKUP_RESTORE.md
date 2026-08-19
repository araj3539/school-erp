# School ERP Backup & Recovery Runbook

## Storage architecture

- Cloudflare R2 is the live application file store.
- Backblaze B2 is the disaster-recovery store for application files and MongoDB dumps.
- R2 backups use `rclone copy`, intentionally avoiding deletion propagation.
- MongoDB is backed up independently as a compressed `mongodump` archive.
- Student document deletion uses a 30-day grace period before the R2 object is permanently deleted.
- B2 remains independent of application deletion and is not treated as a mirror.

## Required GitHub Actions secrets

R2 backup and document cleanup:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `MONGODB_URI`

B2 backup:

- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `B2_ENDPOINT`

## Normal schedules

- R2 -> B2: daily at 02:30 UTC (08:00 IST).
- MongoDB -> B2: daily at 03:00 UTC (08:30 IST).
- Expired student-document cleanup: daily at 04:00 UTC (09:30 IST).
- Orphaned student-document report: weekly on Sunday at 04:30 UTC (10:00 IST).
- Backup health check: every 6 hours.
- Backup, cleanup, and reporting workflows can also be started manually from GitHub Actions.

## Student document lifecycle

### Upload

1. The API validates the document type and file.
2. Raster images are normalized, resized to a maximum of 1200x1200, and compressed.
3. A unique R2 object key is generated using the student ID and document ID.
4. The file is uploaded to R2.
5. MongoDB stores the R2 key and document metadata.
6. The previous active student photo, if replaced, is marked `pending_deletion` rather than being immediately removed.

### Delete

A normal document deletion does not immediately delete the R2 object.

MongoDB marks it as:

- `status: pending_deletion`
- `deletedAt: <time of deletion>`
- `deletionScheduledAt: <time + 30 days>`

The normal student APIs hide pending-deletion documents from users.

### Restore

A document can be restored during the 30-day grace period through the restore endpoint. Photo restoration is rejected if another active student photo already exists, preventing two active photos for one student.

### Permanent cleanup

The daily cleanup workflow finds documents whose `deletionScheduledAt` has passed, deletes the R2 object, and removes the MongoDB document metadata only after the R2 deletion succeeds. If R2 deletion fails, the MongoDB record remains pending so a later run can retry it.

## R2 -> B2 behavior

The R2 backup workflow uses `rclone copy`, not `rclone sync`.

Therefore:

- New R2 objects are copied to B2.
- Changed R2 objects are copied to B2.
- Objects deleted from R2 are **not** automatically deleted from B2.

This makes B2 a recovery copy rather than a mirror.

## B2 versions and retention

The B2 bucket is configured to keep prior versions for 60 days.

This lifecycle applies to previous versions of the **same B2 object key**. The application intentionally generates unique R2 object keys for uploads, so replacing `photo.jpg` with `pic.jpg` creates two different B2 objects when both have been backed up. The older unique object is therefore not deleted merely because the 60-day prior-version rule exists.

Do not configure a lifecycle rule that hides current `students/` backup objects based only on upload age. Current objects may still be valid recovery copies.

The application must never treat B2 as the live source of truth during normal operation.

## Orphan detection

The weekly orphan report compares `students/` objects in R2 against every student document key in MongoDB, including documents pending deletion. It reports unreferenced objects but does **not** automatically delete them.

This is intentionally conservative: automatic deletion of an unreferenced backup object can destroy recovery data. Any B2 retention/garbage-collection policy must be validated against the recovery requirements before it is made destructive.

## Recovering a file

1. Locate the required object in B2.
2. Download it to a trusted local machine.
3. Verify that it opens correctly.
4. Restore it to the original R2 object key.
5. Confirm the application's MongoDB document metadata points to the correct key/object.
6. Test the file through the application.

If the object was replaced, prefer the historical B2 object created by the earlier unique document key rather than overwriting backup history.

## Recovering MongoDB

MongoDB backups are stored as timestamped archives under:

`database/YYYY/MM/DD/school-erp-YYYYMMDDTHHMMSSZ.archive.gz`

A checksum is stored beside each archive with the `.sha256` suffix. The latest successful archive path is recorded at:

`metadata/mongodb-latest-path.txt`

To restore into a temporary MongoDB instance first:

```bash
mongorestore --gzip --archive=school-erp-YYYYMMDDTHHMMSSZ.archive.gz --drop --uri="<TEMPORARY_MONGODB_URI>"
```

Always restore to a temporary database first. Verify students, teachers, fees, attendance, payments, users, and document metadata before considering a production restore.

## R2 disaster recovery

If R2 is accidentally emptied or corrupted:

1. Do **not** run a destructive sync from R2 to B2.
2. Stop or restrict application writes if required to prevent further damage.
3. Identify the required B2 objects and versions.
4. Restore B2 objects to a temporary R2 prefix first.
5. Verify object names, checksums where available, and MongoDB document references.
6. Restore to the live R2 bucket only after validation.
7. Test representative student photos and PDFs through the application.

## Backup verification

A successful workflow run proves that the backup command completed and that the expected backup objects are visible in B2. It is not by itself a complete disaster-recovery test.

At least monthly:

1. Download several recent images and PDFs from B2.
2. Confirm they open and match expected content.
3. Download one older backup object/version.
4. Restore one MongoDB dump to a temporary database.
5. Verify representative student, teacher, fee, attendance, payment, and document records.
6. Record the restore date, backup selected, and result.

## Backup health

The health workflow checks that both the R2 manifest and the MongoDB latest-backup pointer are recent. A failed health check means backups should be treated as stale until a successful backup run completes.

## Incident rule

If a backup workflow or health check fails:

1. Treat the backup as stale.
2. Inspect the failed GitHub Actions run.
3. Do not delete or rotate the last known-good B2 backup while investigating.
4. Run the affected backup manually after fixing the cause.
5. Perform a spot-check before considering backup health restored.
