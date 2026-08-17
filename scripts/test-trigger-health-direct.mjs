import { tasks, runs } from "@trigger.dev/sdk";

if (!process.env.TRIGGER_SECRET_KEY) {
  console.error("TRIGGER_SECRET_KEY missing in environment");
  process.exit(1);
}

try {
  console.log("Triggering engineering-health-check on Trigger.dev with key:", process.env.TRIGGER_SECRET_KEY.slice(0, 10) + "...");
  const handle = await tasks.trigger("engineering-health-check", {
    source: "cloud-ide-copilot-verify",
    nonce: crypto.randomUUID(),
  });

  console.log("TRIGGER_TRIGGERED=YES");
  console.log(`TRIGGER_HEALTH_RUN_ID=${handle.id}`);

  console.log("Polling run status for run:", handle.id);
  const deadline = Date.now() + 60 * 1000;
  while (Date.now() < deadline) {
    const run = await runs.retrieve(handle.id);
    console.log(`RUN_STATUS=${run.status}`);
    if (run.status === "COMPLETED") {
      console.log("TRIGGER_HEALTH_COMPLETED=PASS");
      console.log("RUN_OUTPUT:", JSON.stringify(run.output, null, 2));
      process.exit(0);
    }
    if (["FAILED", "CRASHED", "CANCELED", "SYSTEM_FAILURE", "EXPIRED"].includes(run.status)) {
      console.error(`TRIGGER_HEALTH_FAILED status=${run.status}`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
} catch (err) {
  console.error("ERROR triggering task:", err.message, err);
  process.exit(1);
}
