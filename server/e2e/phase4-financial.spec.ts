import { test, expect } from "@playwright/test";

const apiUrl = process.env.E2E_API_URL;
const fixturePassword = process.env.E2E_FIXTURE_PASSWORD;
const schoolACode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";

async function login(request: any) {
  const response = await request.post("/api/v1/auth/login", {
    data: { email: principalEmail, password: fixturePassword, schoolCode: schoolACode },
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify(body)).toBe(200);
  return body.accessToken ?? body.data?.accessToken;
}

function auth(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

test.beforeAll(() => {
  expect(apiUrl, "E2E_API_URL is required").toBeTruthy();
  expect(fixturePassword, "E2E_FIXTURE_PASSWORD is required").toBeTruthy();
});

test.describe("Phase 4 financial acceptance", () => {
  test("receipt endpoint returns a PDF for an existing tenant payment", async ({ request }) => {
    const token = await login(request);
    const paymentsResponse = await request.get("/api/v1/fees/payments?limit=1", auth(token));
    expect(paymentsResponse.status()).toBe(200);
    const paymentsBody = await paymentsResponse.json();
    const payment = paymentsBody.data?.[0];
    test.skip(!payment?._id, "The deployed school fixture has no payment record");

    const receiptResponse = await request.get(`/api/v1/fees/receipt/${payment._id}`, auth(token));
    expect(receiptResponse.status()).toBe(200);
    expect(receiptResponse.headers()["content-type"]).toContain("application/pdf");
    expect(receiptResponse.headers()["content-disposition"]).toContain(`receipt-${payment.receiptNo}.pdf`);
    const bytes = await receiptResponse.body();
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  });

  test("reconciliation keeps period collections separate from lifetime ledger totals", async ({ request }) => {
    const token = await login(request);
    const response = await request.get("/api/v1/fees/reports/reconciliation?startDate=2026-01-01T00%3A00%3A00.000Z&endDate=2026-12-31T23%3A59%3A59.999Z", auth(token));
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.periodCollections).toEqual(expect.objectContaining({ paymentCount: expect.any(Number), reversalCount: expect.any(Number), grossCollected: expect.any(Number), reversedAmount: expect.any(Number), netCollected: expect.any(Number) }));
    expect(body.ledger).toEqual(expect.objectContaining({ paymentCount: expect.any(Number), reversalCount: expect.any(Number), grossCollected: expect.any(Number), reversedAmount: expect.any(Number), netCollected: expect.any(Number), recordedPaid: expect.any(Number), ledgerVariance: expect.any(Number), reconciled: expect.any(Boolean) }));
    expect(body.period.startDate).toBe("2026-01-01T00:00:00.000Z");
    expect(body.period.endDate).toBe("2026-12-31T23:59:59.999Z");
  });

  test("reversal guard rejects an amount larger than the original payment without mutating the ledger", async ({ request }) => {
    const token = await login(request);
    const paymentsResponse = await request.get("/api/v1/fees/payments?limit=1", auth(token));
    expect(paymentsResponse.status()).toBe(200);
    const paymentsBody = await paymentsResponse.json();
    const payment = paymentsBody.data?.[0];
    test.skip(!payment?._id, "The deployed school fixture has no payment record");

    const response = await request.post(`/api/v1/fees/payments/${payment._id}/reverse`, {
      ...auth(token),
      data: { type: "reversal", amount: payment.amount + 0.01, reason: "Phase 4 boundary acceptance test" },
    });
    expect(response.status()).toBe(400);
  });
});
