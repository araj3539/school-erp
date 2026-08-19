# School ERP Backup & Recovery Runbook

## Storage architecture

- Cloudflare R2 is the live application file store and contains current files only.
- Backblaze B2 is the recovery store for R2 files and MongoDB dumps.
- R2 -> B2 first copies current R2 files, then marks B2 objects under `schools/` that no longer exist in R2 as deleted.
- B2 object versioning keeps the deleted/replaced content available according to the bucket's 60-day prior-version retention policy.
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
3. Each student/document type has a stable extensionless R2 object key under that student, for example:

`schools/<schoolId>/students/<studentId>/documents/photo`

`schools/<schoolId>/students/<studentId>/documents/aadhar`

`schools/<schoolId>/students/<studentId>/documents/birth_certificate`

4. The file is uploaded to R2 with its real MIME type.
5. MongoDB stores the stable R2 key and the original filename/MIME type/size metadata.

The storage key intentionally does not contain the uploaded filename or extension. This allows `photo.jpg` to be replaced by `pic.png` while both use the same R2/B2 object key.

### Replace

Uploading another file of the same document type overwrites the current R2 object at the same stable key. MongoDB metadata is updated with the new original filename, MIME type, size, and upload time.

Example:

- Student A uploads `photo.jpg` -> R2 key `.../documents/photo`
- Student A replaces it with `pic.png` -> the R2 key remains `.../documents/photo`

At the next R2 -> B2 backup, B2 receives the same object name again and retains the previous B2 version.

### Delete

Deleting a student document removes its MongoDB metadata and deletes the current R2 object immediately. R2 therefore remains current-only.

At the next R2 -> B2 backup, the workflow compares the current `schools/` object lists. If the object is missing from R2 but still exists as a current B2 object, the workflow issues a B2 delete-by-name. With B2 versioning, that creates a delete marker while preserving the previous file version for the configured recovery window.

## B2 versions and retention

The B2 bucket should be configured to keep prior versions for **60 days**.

The application uses stable object keys per student and document type specifically so replacement of the same document type creates a new B2 version of the same key.

For a deleted R2 file, the backup workflow creates a B2 delete marker. The former B2 version then becomes a previous version and is covered by the 60-day retention policy.

Do not configure a lifecycle rule that deletes current B2 objects solely by their upload age.

## Recovery model

The target behavior is intentionally simple:

- R2 = current production files only.
- B2 = backup/recovery copy.
- Replaced files are recoverable as previous B2 versions for 60 days.
- Deleted files become hidden behind a B2 delete marker and their previous version remains recoverable for 60 days.
- No R2 grace-period or cleanup workflow is required.

## Recovering a replaced student document

1. Identify the student's document type and stable object key.
2. Select the required previous B2 version within the 60-day recovery window.
3. Restore that version to the same current R2 key.
4. MongoDB already points to that stable key, so update its metadata if the restored file's original filename/MIME type/size need to be reflected in the application.
5. Test the file through the application.

## Recovering a deleted student document

1. Identify the student's document type and stable object key.
2. Select the retained B2 version from before the delete marker.
3. Restore it to the same R2 key.
4. Recreate the MongoDB document metadata entry for that student/document type, using the same stable R2 key and the recovered file's metadata.
5. Test the file through the application.

Recovery should update R2 and MongoDB together. Restoring a B2 object into R2 without restoring/recreating the corresponding MongoDB metadata does not make the document visible in the ERP.

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

The backup workflow uses `rclone copy` for current files and a separate deletion-reconciliation step.

Therefore:

- New R2 objects are copied to B2.
- Replaced objects using the same stable key create a new B2 version.
- Objects deleted from R2 are marked deleted in B2 by name, leaving their previous B2 version available for the 60-day recovery window.
- Only the `schools/` application-file namespace is reconciled for deletions; MongoDB backup and metadata objects are not affected by this deletion step.

## Important limitations

- A file uploaded and deleted before the next successful R2 -> B2 backup may never exist in B2 and therefore cannot be recovered from B2.
- The 60-day setting applies to previous versions, not to current B2 objects simply because they are old.
- Stable keys are required for B2 versioning to represent replacements as versions of the same logical document.

## Backup verification

A successful workflow run confirms that the backup and deletion-reconciliation commands completed. Periodically verify that sample images/PDFs and a MongoDB archive can actually be restored.
