import { runs, tasks } from "@trigger.dev/sdk";

if (!process.env.TRIGGER_SECRET_KEY) {
  console.error("TRIGGER_QUEUE_HEALTH=FAIL reason=TRIGGER_SECRET_KEY_missing");
  process.exit(1);
}

const handle = await tasks.trigger("engineering-health-check", {
  source: "cli-verification",
  nonce: crypto.randomUUID(),
});

console.log(`TRIGGER_RUN_ID=${handle.id}`);
const deadline = Date.now() + 5 * 60 * 1000;

while (Date.now() < deadline) {
  const run = await runs.retrieve(handle.id);
  console.log(`TRIGGER_STATUS=${run.status}`);

  if (run.status === "COMPLETED") {
    console.log("TRIGGER_QUEUE_HEALTH=PASS");
    process.exit(0);
  }

  if (["FAILED", "CRASHED", "CANCELED", "INTERRUPTED", "SYSTEM_FAILURE", "EXPIRED"].includes(run.status)) {
    console.error(`TRIGGER_QUEUE_HEALTH=FAIL status=${run.status}`);
    process.exit(1);
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
}

console.error("TRIGGER_QUEUE_HEALTH=FAIL reason=timeout");
process.exit(1);
