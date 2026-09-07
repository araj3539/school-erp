# Mobile Release Rollback and Disable Runbook

## Scope

This runbook covers the School ERP Expo/EAS Android release. It is designed to stop or reverse a bad mobile release without using production credentials in local testing.

## Immediate disable / containment

1. Stop promoting the affected EAS build to additional users.
2. If the issue is an OTA update rollout, end the EAS channel rollout or revert the rollout to the previous update.
3. If an OTA update must be replaced, republish the known-good update to the affected channel/runtime.
4. For a native binary defect, stop distributing the affected AAB and publish the next corrected binary through the normal store release process.
5. Preserve the affected build ID, commit SHA, update group/channel, timestamps, and incident notes.

## EAS OTA rollback

Use EAS CLI against the affected channel or branch. The safest action depends on the failure mode:

- Revert an active rollout: `eas update:revert-update-rollout --channel <channel> --non-interactive`
- Roll back to the embedded native update: `eas update:roll-back-to-embedded --channel <channel> --platform android --non-interactive`
- Republish a known-good update: `eas update:republish --channel <channel> --destination-channel <channel> --platform android --non-interactive`

Only run a rollback after identifying the affected channel/runtime and confirming the target update is compatible with the installed native runtime.

## Native Android rollback

Native AAB releases cannot be replaced on already-installed devices by an OTA JavaScript rollback when the defect requires a native binary change. In that case:

1. Halt the bad store rollout.
2. Prepare and validate a corrected production build.
3. Increment the Android version code.
4. Publish the corrected AAB through the store release process.
5. Monitor crash/error telemetry and authentication/API health.

## Recovery verification

After containment, verify:

- Authentication still works.
- Critical dashboard/API flows work.
- No debug endpoints or secrets are exposed.
- The recovered update/build targets the intended runtime version.
- Tenant isolation and authorization gates remain intact.
- The incident record contains the exact build/update identifiers.

## Current release evidence

The Phase 8 production Android build generated on 2026-09-07 completed successfully with Android version code 5. Artifact SHA-256: `45C6BF23187E8727A7EC5E11CB618DF447932837BBFD44F69CB1287037B68BF1`.

Native device acceptance remains a separate gate and must not be marked passed without an actual Android emulator or physical device test.
