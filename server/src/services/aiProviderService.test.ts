import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsDataset } from "./analyticsService.js";

import { getAiStatus, getAnalyticsInsights } from "./aiProviderService.js";

const dataset: AnalyticsDataset = {
  rangeDays: 30,
  generatedAt: "2026-09-11T00:00:00.000Z",
  academicYear: { id: "year-1", name: "2026-27" },
  snapshot: {
    activeStudents: 100,
    activeTeachers: 5,
    classes: 6,
    attendanceRate: 78,
    collection: 10000,
    feeDue: 100000,
    feePaid: 60000,
    feeOutstanding: 40000,
  },
  trends: [{ date: "2026-09-10", attendanceRate: 78, collection: 10000 }],
  feeStatus: [{ status: "pending", count: 10, outstanding: 40000 }],
  dataQuality: {
    activeStudentsMissingClass: 2,
    activeStudentsMissingSection: 1,
    attendanceRecordsWithDuplicateStudents: 0,
  },
};

describe("aiProviderService", () => {
  beforeEach(() => {
    delete process.env.AI_ASSISTANCE_ENABLED;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.AI_TIMEOUT_MS;
    vi.restoreAllMocks();
  });

  it("is disabled by default", () => {
    expect(getAiStatus()).toEqual({ enabled: false, configured: false });
  });

  it("returns deterministic, non-authoritative fallback insights when AI is disabled", async () => {
    const result = await getAnalyticsInsights(dataset);
    expect(result.mode).toBe("fallback");
    expect(result.enabled).toBe(false);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights[0].sources).toContain("snapshot.attendanceRate");
    expect(result.insights[0].actions.join(" ")).toMatch(/existing attendance workflows/i);
  });

  it("accepts a bounded provider response and sanitizes its output", async () => {
    process.env.AI_ASSISTANCE_ENABLED = "true";
    process.env.AI_BASE_URL = "https://ai.example.test/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ insights: [{ title: " Attendance signal ", summary: " Review the selected aggregate window.", actions: ["Check attendance trends."], confidence: "medium", sources: ["snapshot.attendanceRate"] }] }) } }],
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await getAnalyticsInsights(dataset);
    expect(result.mode).toBe("provider");
    expect(result.enabled).toBe(true);
    expect(result.insights[0].title).toBe("Attendance signal");
    expect(fetchMock).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0][1];
    expect(request?.headers).toMatchObject({ authorization: "Bearer test-key" });
    const payload = JSON.parse(String(request?.body));
    expect(payload.model).toBe("test-model");
    expect(payload.messages[1].content).toContain('"activeStudents":100');
    expect(payload.messages[1].content).not.toMatch(/firstName|lastName|phone|admissionNo/i);
  });

  it("falls back when the provider fails", async () => {
    process.env.AI_ASSISTANCE_ENABLED = "true";
    process.env.AI_BASE_URL = "https://ai.example.test/v1";
    process.env.AI_API_KEY = "test-key";
    process.env.AI_MODEL = "test-model";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("provider unavailable"));

    const result = await getAnalyticsInsights(dataset);
    expect(result.mode).toBe("fallback");
    expect(result.enabled).toBe(true);
    expect(result.insights.length).toBeGreaterThan(0);
  });
});
