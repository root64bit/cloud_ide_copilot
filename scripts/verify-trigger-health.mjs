const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const response = await fetch(`${appUrl}/api/trigger/health`, { method: "POST" });
const body = await response.json().catch(() => ({}));

if (!response.ok || !body.runId) {
  console.error(`TRIGGER_QUEUE_HEALTH=FAIL status=${response.status} error=${body.error || "unknown"}`);
  process.exit(1);
}

console.log(`TRIGGER_QUEUE_HEALTH=PASS runId=${body.runId}`);
console.log(`Check status: ${appUrl}/api/trigger/runs/${body.runId}`);
