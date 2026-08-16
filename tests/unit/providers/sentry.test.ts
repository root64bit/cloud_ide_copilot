import { SentryIncidentProvider } from "@/server/providers/incident/sentry.provider";
import { describe, expect, it } from "vitest";

describe("Sentry Incident Provider & Sanitization", () => {
  const provider = new SentryIncidentProvider();

  it("normalizes and sanitizes Sentry issue webhook payload", () => {
    const rawSentryPayload = {
      data: {
        issue: {
          id: "98234",
          title: "TypeError: Cannot read properties of undefined (reading 'discountCode')",
          level: "error",
          environment: "production",
          firstSeen: "2026-08-16T18:00:00Z",
          lastSeen: "2026-08-16T20:00:00Z",
          count: 15,
        },
        event: {
          event_id: "evt_abcdef",
          release: "onedealer@a9f82d1c5e4b7890123456789abcdef012345678",
          culprit: "src/lib/checkout/pricing.ts in calculateTotal",
          exception: {
            values: [
              {
                stacktrace: {
                  frames: [
                    {
                      filename: "src/lib/checkout/pricing.ts",
                      lineno: 48,
                      function: "calculateTotal",
                      context_line: "const code = item.discountCode.percent;",
                    },
                  ],
                },
              },
            ],
          },
          request: {
            url: "https://onedealer.example.com/api/checkout",
            method: "POST",
            headers: {
              authorization: "Bearer secret-user-token-12345",
              cookie: "session=sensitive-session-cookie-value",
            },
          },
        },
      },
    };

    const normalized = provider.normalizeWebhook(rawSentryPayload);

    expect(normalized.provider).toBe("sentry");
    expect(normalized.externalIssueId).toBe("98234");
    expect(normalized.commitSha).toBe("a9f82d1c5e4b7890123456789abcdef012345678");
    expect(normalized.stacktrace.length).toBe(1);
    expect(normalized.stacktrace[0].filename).toBe("src/lib/checkout/pricing.ts");

    // Verify sensitive request cookies & authorization headers were sanitized
    expect(JSON.stringify(normalized.sanitizedMetadata)).not.toContain("sensitive-session-cookie-value");
  });
});
