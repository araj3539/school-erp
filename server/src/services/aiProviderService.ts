import { AnalyticsDataset } from "./analyticsService.js";

export interface AnalyticsInsight {
  title: string;
  summary: string;
  actions: string[];
  confidence: "low" | "medium" | "high";
  sources: string[];
}

interface AiProviderConfig {
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs: number;
}

function config(): AiProviderConfig {
  const enabled = process.env.AI_ASSISTANCE_ENABLED === "true";
  return {
    enabled,
    baseUrl: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
    timeoutMs: Math.min(Math.max(Number(process.env.AI_TIMEOUT_MS ?? 7000), 1000), 15000),
  };
}

function fallbackInsights(dataset: AnalyticsDataset): AnalyticsInsight[] {
  const insights: AnalyticsInsight[] = [];
  const { snapshot, dataQuality } = dataset;

  if (snapshot.attendanceRate > 0 && snapshot.attendanceRate < 85) {
    insights.push({
      title: "Attendance needs attention",
      summary: `Attendance is ${snapshot.attendanceRate}% for the selected period, below the 85% monitoring threshold.`,
      actions: ["Review class-level attendance patterns.", "Check recurring absence or late-marking issues.", "Use existing attendance workflows for follow-up."],
      confidence: "high",
      sources: ["snapshot.attendanceRate", "trends"],
    });
  }

  const outstandingRatio = snapshot.feeDue > 0 ? snapshot.feeOutstanding / snapshot.feeDue : 0;
  if (outstandingRatio > 0.3) {
    insights.push({
      title: "Outstanding fees are elevated",
      summary: `${Math.round(outstandingRatio * 100)}% of current-year fee value remains outstanding.`,
      actions: ["Review outstanding balances in the Fees module.", "Prioritize existing school-approved follow-up processes.", "Do not change balances from analytics recommendations."],
      confidence: "high",
      sources: ["snapshot.feeDue", "snapshot.feeOutstanding", "feeStatus"],
    });
  }

  if (dataQuality.activeStudentsMissingClass > 0 || dataQuality.activeStudentsMissingSection > 0 || dataQuality.attendanceRecordsWithDuplicateStudents > 0) {
    insights.push({
      title: "Data quality checks need review",
      summary: `${dataQuality.activeStudentsMissingClass} active students lack a class, ${dataQuality.activeStudentsMissingSection} lack a section, and ${dataQuality.attendanceRecordsWithDuplicateStudents} attendance records contain duplicate student entries.`,
      actions: ["Resolve missing class or section assignments.", "Review attendance records with duplicate students.", "Re-run analytics after corrections."],
      confidence: "high",
      sources: ["dataQuality"],
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Operations look stable",
      summary: "No high-signal threshold or data-quality issue was detected in the selected analytics window.",
      actions: ["Continue routine monitoring.", "Review trends for meaningful changes before acting.", "Keep academic and financial decisions with authorized staff."],
      confidence: "medium",
      sources: ["snapshot", "trends", "dataQuality"],
    });
  }

  return insights.slice(0, 3);
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
}

function sanitizeInsight(input: any): AnalyticsInsight | null {
  if (!input || typeof input !== "object") return null;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
  const summary = typeof input.summary === "string" ? input.summary.trim().slice(0, 500) : "";
  const actions = Array.isArray(input.actions) ? input.actions.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().slice(0, 180)).filter(Boolean).slice(0, 3) : [];
  const confidence = input.confidence === "low" || input.confidence === "medium" || input.confidence === "high" ? input.confidence : "low";
  const sources = Array.isArray(input.sources) ? input.sources.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().slice(0, 80)).filter(Boolean).slice(0, 8) : [];
  if (!title || !summary || actions.length === 0) return null;
  return { title, summary, actions, confidence, sources };
}

async function requestProvider(dataset: AnalyticsDataset): Promise<AnalyticsInsight[] | null> {
  const current = config();
  if (!current.enabled || !current.baseUrl || !current.apiKey || !current.model) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), current.timeoutMs);
  try {
    const response = await fetch(`${current.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${current.apiKey}` },
      body: JSON.stringify({
        model: current.model,
        temperature: 0.1,
        max_tokens: 700,
        messages: [
          { role: "system", content: "You provide non-authoritative operational suggestions for school administrators. Use only the supplied aggregate dataset. Never identify a student, expose personal data, change a financial or academic fact, or make a final decision. Return JSON only: {insights:[{title,summary,actions,confidence,sources}]}. Keep at most 3 insights and 3 actions per insight." },
          { role: "user", content: JSON.stringify(dataset) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload: any = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const parsed: any = typeof content === "string" ? extractJson(content) : null;
    const rawInsights = Array.isArray(parsed?.insights) ? parsed.insights : [];
    const sanitized = rawInsights.map(sanitizeInsight).filter(Boolean) as AnalyticsInsight[];
    return sanitized.length > 0 ? sanitized.slice(0, 3) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function getAnalyticsInsights(dataset: AnalyticsDataset): Promise<{ insights: AnalyticsInsight[]; mode: "provider" | "fallback"; enabled: boolean }> {
  const current = config();
  const startedAt = Date.now();
  const providerInsights = await requestProvider(dataset);
  const mode = providerInsights ? "provider" : "fallback";
  console.log(JSON.stringify({ event: "ai_analytics_insight", mode, enabled: current.enabled, durationMs: Date.now() - startedAt }));
  return { insights: providerInsights ?? fallbackInsights(dataset), mode, enabled: current.enabled };
}

export function getAiStatus() {
  const current = config();
  return { enabled: current.enabled, configured: Boolean(current.baseUrl && current.apiKey && current.model) };
}
