# Phase 11 — Payment Activation Runbook

## Purpose

Track the final operational step after the online-payment engineering implementation is complete. This document does not replace the canonical engineering workflow or payment implementation tests; it records the provider-activation gate and its evidence.

## Current state

The payment domain, provider adapter boundary, signed verification, replay/idempotency controls, atomic ledger application, refunds/reversals and reconciliation are implemented and regression-tested.

The provider remains **disabled by default**. Production payment activation is not considered complete until the project owner performs the real provider-side checks below.

## Activation gate

### 1. Merchant readiness

- Complete provider onboarding/KYC.
- Confirm the production merchant account is approved for the intended checkout flow.
- Confirm the legal/business information shown in receipts and payment communications.

### 2. Production secrets

Configure provider credentials and webhook signing secrets only in the deployment secret store. Never place them in Git, documentation, browser bundles or committed environment files.

### 3. Webhook configuration

Configure the production webhook endpoint and provider signing secret. Confirm the endpoint receives provider events using the raw request body required for signature verification.

### 4. Sandbox/test-mode verification

Run a controlled provider test-mode sequence covering:

- payment-order creation;
- successful and failed payment outcomes;
- signed webhook delivery;
- duplicate/replayed webhook delivery;
- out-of-order event handling where supported;
- refund/reversal behavior;
- reconciliation and ledger evidence.

Verify that client-side checkout completion never directly mutates authoritative payment or fee state.

### 5. Operational evidence

Confirm logs/audit records contain enough request/event identifiers to investigate failures without recording secrets, authentication material, payment credentials or unnecessary student data.

Confirm the rollback/disable path is understood and tested. The provider can remain disabled without breaking normal fee management.

### 6. Controlled production verification

After the provider-side checks pass, perform a single controlled production transaction using approved test procedures. Verify:

- authoritative Payment/PaymentOrder state;
- Fee balance and reversal boundaries;
- webhook idempotency;
- receipt generation and tenant branding;
- reconciliation output;
- audit evidence.

### 7. Final enablement

Only after all preceding evidence is captured should `PAYMENT_PROVIDER=razorpay` be enabled in production.

## Rollback / disable

If provider verification fails or unexpected ledger behavior is observed:

1. Disable the provider at the deployment configuration layer.
2. Preserve provider event/request identifiers and audit evidence.
3. Do not manually patch financial balances to hide a provider error.
4. Re-run the focused payment reconciliation and invariant tests.
5. Resume activation only after the failure mode is understood and the regression gate is green.

## Evidence record

Linear tracking issue: **ALO-42 — Production payment configuration and rollback**.

Engineering close-out is already complete. This checklist is intentionally separate because merchant onboarding, credentials and provider-side verification require project-owner access that cannot be safely simulated in repository code.
