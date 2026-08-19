# School ERP Backup & Recovery Runbook

## Storage architecture

- Cloudflare R2 is the live application file store.
- Backblaze B2 is the disaster-recovery store for application files and MongoDB dumps.
- R2 backups use `rclone copy`, intentionally avoiding deletion propagation.
- MongoDB is backed up independently as a compressed `mongodump` archive.
- Backup manifests are stored in B2 under `metadata/`.

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
- Backup health check: every 6 hours.
- All backup workflows can also be started manually from GitHub Actions.

## R2 deletion behavior

The R2 backup workflow uses `rclone copy`, not `rclone sync`.

Therefore:

- New R2 objects are copied to B2.
- Changed R2 objects are copied to B2.
- Objects deleted from R2 are **not** automatically deleted from B2.

This makes B2 a recovery copy rather than a mirror.

The workflow also refuses to run when R2 is empty and refuses to proceed when the object count falls below 10% of the previous manifest count. This is a safety stop against accidental or malicious mass deletion. A legitimate large cleanup should be reviewed and handled deliberately rather than bypassing the guard.

## B2 versions and retention

Backups should be retained long enough to cover accidental deletion, corruption, and delayed discovery of incidents.

Do not configure a B2 lifecycle rule that immediately removes old file versions. If B2 version history is available for the bucket, keep previous versions for the chosen recovery window.

The application must never treat B2 as the live source of truth during normal operation.

## Recovering a file

1. Locate the required object in B2.
2. Download it to a trusted local machine.
3. Verify that it opens correctly.
4. Restore it to the original R2 object key.
5. Confirm the application's MongoDB document metadata still points to the correct key/object.
6. Test the file through the application.

If the object was replaced, prefer the appropriate historical B2 version rather than overwriting the backup history.

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
