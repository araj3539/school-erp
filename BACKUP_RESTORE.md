# School ERP Backup & Recovery Runbook

## Storage architecture

- Cloudflare R2 is the live application file store and contains current files only.
- Backblaze B2 is the recovery store for R2 files and MongoDB dumps.
- R2 -> B2 uses `rclone copy`, so R2 deletions are not propagated to B2.
- MongoDB is backed up independently as compressed `mongodump` archives.

## Normal schedules

- R2 -> B2: daily at 02:30 UTC (08:00 IST).
- MongoDB -> B2: daily at 03:00 UTC (08:30 IST).
- Backup health check: every 6 hours.
- Backup workflows can also be started manually from GitHub Actions.

## Student document lifecycle

### Upload

1. The API validates the document type and file.
2. Raster images are normalized, resized to a maximum of 1200x1200, and compressed.
3. Each student/document type has a stable R2 object key under that student, for example:

`schools/<schoolId>/students/<studentId>/documents/photo.jpg`

`schools/<schoolId>/students/<studentId>/documents/aadhar.pdf`

`schools/<schoolId>/students/<studentId>/documents/birth_certificate.pdf`

4. The file is uploaded to R2.
5. MongoDB stores the R2 key and the original filename/MIME type/size metadata.

### Replace

Uploading another file of the same document type replaces the current R2 object at the same key.

Example:

- Student A photo: `photo.jpg`
- Replaced with `pic.jpg`
- R2 key remains `.../students/<studentId>/documents/photo.jpg`

Because the R2 -> B2 workflow uses `rclone copy`, the previous B2 version of that same key is not deleted. B2's 60-day prior-version retention can therefore provide the intended recovery window for the replaced file.

### Delete

Deleting a student document removes it from MongoDB and deletes the current R2 object immediately. R2 therefore contains current files only.

The already-created B2 backup is not modified by that R2 deletion. The B2 copy/version remains available for recovery for the configured recovery window.

## B2 versions and retention

The B2 bucket is configured to keep prior versions for 60 days.

The application uses stable object keys per student and document type specifically so replacement of the same document type creates a new B2 version of the same key.

The 60-day lifecycle applies to previous versions of the same B2 object key. Current B2 objects are not removed simply because they are older than 60 days.

Do not configure a lifecycle rule that deletes current backup objects solely by their upload age.

## Recovery model

The target behavior is intentionally simple:

- R2 = current production files only.
- B2 = backup/recovery copy.
- Deleted or replaced R2 files remain recoverable from B2 for the configured 60-day version window.
- No R2 grace-period or cleanup workflow is required.

## Recovering a student document

1. Identify the student's document type and stable object key.
2. Select the required previous B2 version within the 60-day recovery window.
3. Restore the recovered object to the current R2 key.
4. Confirm MongoDB metadata points to that key.
5. Test the file through the application.

## Recovering MongoDB

MongoDB backups are stored as timestamped archives under:

`database/YYYY/MM/DD/school-erp-YYYYMMDDTHHMMSSZ.archive.gz`

A checksum is stored beside each archive with the `.sha256` suffix. The latest successful archive path is recorded at:

`metadata/mongodb-latest-path.txt`

To restore into a temporary MongoDB instance first:

```bash
mongorestore --gzip --archive=school-erp-YYYYMMDDTHHMMSSZ.archive.gz --drop --uri="<TEMPORARY_MONGODB_URI>"
```

Always verify the temporary restore before considering a production restore.

## R2 -> B2 behavior

The backup workflow uses `rclone copy`, not `rclone sync`.

Therefore:

- New R2 objects are copied to B2.
- Replaced objects are updated at the same B2 key and B2 keeps the previous version.
- Objects deleted from R2 are not deleted from B2 automatically.

## Important limitation

The 60-day B2 version policy protects replacements at the same stable object key. It is not a general rule that automatically deletes every old backup object after 60 days.

## Backup verification

A successful workflow run confirms that the backup command completed and B2 contains the expected backup data. Periodically verify that sample images/PDFs and a MongoDB archive can actually be restored.
