import { School } from "../models/index.js";
import { runCalendarAutomation } from "./calendarAutomationService.js";

export async function startCalendarAutomationWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const schools = await School.find({ status: { $ne: "suspended" } }).select("_id").lean();
      for (const school of schools) await runCalendarAutomation(school._id);
    } finally { running = false; }
  };
  await tick();
  return setInterval(() => { void tick(); }, 60 * 60 * 1000);
}
