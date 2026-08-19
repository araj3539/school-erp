# School ERP Backup & Recovery Runbook

## Storage architecture

- Cloudflare R2 is the live application file store.
- Backblaze B2 is the disaster-recovery file and database backup store.
- R2 backups use `rclone copy`, intentionally avoiding deletion propagation.
- MongoDB is backed up independently as a compressed `mongodump` archive.

## Required GitHub Actions secrets

R2 backup:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `B2_ENDPOINT`

MongoDB backup additionally requires:

- `MONGODB_URI`

## Normal backup schedule

- R2 -> B2: daily at 02:30 UTC (08:00 IST).
- MongoDB -> B2: daily at 03:00 UTC (08:30 IST).
- Both workflows can also be started manually from GitHub Actions.

## Important deletion behavior

The R2 backup workflow uses `rclone copy`, not `rclone sync`.

Therefore:

- New R2 objects are copied to B2.
- Changed R2 objects are updated in B2.
- Objects deleted from R2 are **not** automatically deleted from B2.

Do not change the workflow back to `rclone sync` unless you intentionally want mirror semantics.

## Recovering a file

1. Locate the object in B2.
2. Download it to a trusted local machine.
3. Verify the file opens correctly.
4. Upload it back to the correct R2 key using the application/storage tooling.
5. Update MongoDB document metadata if the object's key or URL changed.

## Recovering MongoDB

The database backup is stored under:

`database/YYYY-MM-DD/school-erp.archive.gz`

To restore into a temporary MongoDB instance first, download the archive and run:

```bash
mongorestore --gzip --archive=school-erp.archive.gz --drop --uri="<TEMPORARY_MONGODB_URI>"
```

Always restore to a temporary database first and verify students, teachers, fees, attendance, payments, and document metadata before considering a production restore.

## R2 disaster recovery

If R2 is accidentally emptied:

1. **Do not run a destructive sync.**
2. Stop application writes if necessary.
3. Identify the required B2 objects.
4. Restore B2 objects to a temporary R2 prefix first.
5. Verify object names and application metadata.
6. Restore to the live R2 bucket only after validation.

## Backup verification

A successful workflow run proves that the backup command completed and that objects are visible in B2. It is not a complete disaster-recovery test.

At least monthly:

1. Pick several recent images/PDFs.
2. Download them from B2.
3. Confirm they open and match the expected content.
4. Restore one MongoDB dump to a temporary database.
5. Confirm representative student/document records and references.

## Retention and versioning

B2 should be configured with a retention/versioning policy appropriate for the school. Do not configure a lifecycle rule that immediately removes old versions if the goal is recovery from accidental deletion or corruption.

Before relying on B2 for disaster recovery, perform one documented test restore.

## Incident rule

If a backup workflow fails, treat the backup as stale until a successful run completes. Do not assume the previous backup is current.
