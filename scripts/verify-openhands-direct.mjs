const baseUrl = (process.env.OPENHANDS_API_URL || "https://app.all-hands.dev").replace(/\/$/, "");
const apiKey = process.env.OPENHANDS_API_KEY || process.env.OPENHANDS_CLOUD_API_KEY;

if (!apiKey) {
  console.error("OPENHANDS_DIRECT_VERIFY=FAIL reason=OPENHANDS_API_KEY_missing");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "X-Access-Token": apiKey,
  "Content-Type": "application/json",
};

console.log("Creating OpenHands Cloud conversation against root64bit/cloud_ide_copilot (read-only verification)...");

const startResp = await fetch(`${baseUrl}/api/v1/app-conversations`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    initial_message: {
      role: "user",
      content: [{
        type: "text",
        text: "INTEGRATION VERIFICATION ONLY. Inspect repository structure and finish without modifying any file. Do not commit, push, create a PR, or deploy."
      }],
      run: true,
    },
    selected_repository: "root64bit/cloud_ide_copilot",
    selected_branch: "main",
    public: false,
    observability_span_name: "cloud_ide_copilot_verification",
    observability_tags: ["cloud-ide-copilot", "verification"],
    observability_metadata: { purpose: "live_integration_verification" },
  }),
});

if (!startResp.ok) {
  const errText = await startResp.text();
  console.error(`OPENHANDS_START=FAIL status=${startResp.status} body=${errText}`);
  process.exit(1);
}

const startTask = await startResp.json();
console.log(`OPENHANDS_START_TASK_ID=${startTask.id}`);
console.log(`OPENHANDS_INITIAL_STATUS=${startTask.status}`);

// Poll start task until conversation is ready
let conversationId = startTask.app_conversation_id;
const startDeadline = Date.now() + 5 * 60 * 1000;

while (!conversationId && Date.now() < startDeadline) {
  await new Promise((r) => setTimeout(r, 4000));
  const pollResp = await fetch(`${baseUrl}/api/v1/app-conversations/start-tasks?ids=${encodeURIComponent(startTask.id)}`, { headers });
  if (pollResp.ok) {
    const list = await pollResp.json();
    const task = Array.isArray(list) ? list[0] : list;
    if (task) {
      console.log(`OPENHANDS_START_TASK_STATUS=${task.status}`);
      if (task.status === "ERROR") {
        console.error(`OPENHANDS_START=FAIL error=${task.detail || "Startup error"}`);
        process.exit(1);
      }
      if (task.app_conversation_id) {
        conversationId = task.app_conversation_id;
        break;
      }
    }
  }
}

if (!conversationId) {
  console.error("OPENHANDS_START=FAIL reason=timed_out_waiting_for_conversation_id");
  process.exit(1);
}

console.log(`OPENHANDS_REAL_CONVERSATION_ID=${conversationId}`);
console.log(`OPENHANDS_CONVERSATION_URL=${baseUrl}/conversations/${encodeURIComponent(conversationId)}`);

// Poll conversation execution status
const execDeadline = Date.now() + 10 * 60 * 1000;
let finalStatus = "unknown";

while (Date.now() < execDeadline) {
  const convResp = await fetch(`${baseUrl}/api/v1/app-conversations?ids=${encodeURIComponent(conversationId)}`, { headers });
  if (convResp.ok) {
    const list = await convResp.json();
    const conv = Array.isArray(list) ? list[0] : list;
    if (conv) {
      const execStatus = conv.execution_status || conv.status || "running";
      console.log(`OPENHANDS_EXECUTION_STATUS=${execStatus}`);
      finalStatus = execStatus;
      if (["finished", "error", "stuck", "waiting_for_confirmation", "COMPLETED", "FAILED"].includes(execStatus)) {
        break;
      }
    }
  }
  await new Promise((r) => setTimeout(r, 5000));
}

console.log("OPENHANDS_LIVE_API_STATUS=PASS");
console.log(`OPENHANDS_REAL_CONVERSATION_ID=${conversationId}`);
console.log(`OPENHANDS_REAL_CONVERSATION_STATUS=${finalStatus}`);
console.log(`OPENHANDS_CONVERSATION_URL=${baseUrl}/conversations/${encodeURIComponent(conversationId)}`);
