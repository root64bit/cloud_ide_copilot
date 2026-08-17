const baseUrl = (process.env.OPENHANDS_API_URL || "https://app.all-hands.dev").replace(/\/$/, "");
const apiKey = process.env.OPENHANDS_API_KEY || process.env.OPENHANDS_CLOUD_API_KEY;

if (!apiKey) {
  console.error("OPENHANDS_CLOUD_HEALTH=FAIL reason=OPENHANDS_API_KEY_missing");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/v1/app-conversations/search?limit=1`, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "X-Access-Token": apiKey,
  },
});

if (!response.ok) {
  console.error(`OPENHANDS_CLOUD_HEALTH=FAIL status=${response.status}`);
  process.exit(1);
}

console.log("OPENHANDS_CLOUD_HEALTH=PASS");
