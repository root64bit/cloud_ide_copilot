import { runs, tasks } from "@trigger.dev/sdk";

const repository = process.env.OPENHANDS_TEST_REPOSITORY;
const branch = process.env.OPENHANDS_TEST_BRANCH || "main";

if (!process.env.TRIGGER_SECRET_KEY) {
  console.error("TRIGGER_OPENHANDS_VERIFY=FAIL reason=TRIGGER_SECRET_KEY_missing");
  process.exit(1);
}
if (!repository || !repository.includes("/")) {
  console.error("TRIGGER_OPENHANDS_VERIFY=FAIL reason=OPENHANDS_TEST_REPOSITORY_missing expected=owner/repository");
  process.exit(1);
}

const handle = await tasks.trigger("openhands-repair", {
  workspaceId: `verify_${Date.now()}`,
  repository,
  branch,
  incidentTitle: "Integration verification only",
  diagnosis: {
    summary: "Verify that Trigger.dev can execute OpenHands Cloud against the selected repository.",
    probableRootCause: "No production defect; this is a read-only integration verification.",
    confidence: 1,
    suspectedFiles: [],
    recommendedChanges: [],
    risks: ["The verification must not modify repository files."],
    recommendedTests: [],
    missingInformation: [],
  },
  instructions:
    "INTEGRATION VERIFICATION ONLY. Inspect the repository and finish without modifying any file. Do not commit, push, create a PR, or deploy.",
});

console.log(`TRIGGER_RUN_ID=${handle.id}`);
const deadline = Date.now() + 60 * 60 * 1000;

while (Date.now() < deadline) {
  const run = await runs.retrieve(handle.id);
  console.log(`TRIGGER_STATUS=${run.status}`);

  if (run.status === "COMPLETED") {
    const output = run.output || {};
    console.log("TRIGGER_OPENHANDS_VERIFY=PASS");
    if (output.conversationId) console.log(`OPENHANDS_CONVERSATION_ID=${output.conversationId}`);
    if (output.conversationUrl) console.log(`OPENHANDS_CONVERSATION_URL=${output.conversationUrl}`);
    console.log(`OPENHANDS_PATCH_APPLIED=${Boolean(output.patchApplied)}`);
    process.exit(0);
  }

  if (["FAILED", "CRASHED", "CANCELED", "INTERRUPTED", "SYSTEM_FAILURE", "EXPIRED"].includes(run.status)) {
    console.error(`TRIGGER_OPENHANDS_VERIFY=FAIL status=${run.status}`);
    process.exit(1);
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
}

console.error("TRIGGER_OPENHANDS_VERIFY=FAIL reason=timeout");
process.exit(1);
