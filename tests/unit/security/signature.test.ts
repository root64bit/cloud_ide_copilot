import crypto from "crypto";
import { verifyGitHubSignature, verifySentrySignature } from "@/lib/security/signature";
import { describe, expect, it } from "vitest";

describe("Webhook HMAC-SHA256 Signature Verification", () => {
  const secret = "super-secret-signing-key-12345";
  const payload = JSON.stringify({ event_id: "evt_12345", message: "Production TypeError" });

  it("verifies valid Sentry HMAC signature", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(Buffer.from(payload, "utf-8"))
      .digest("hex");

    const isValid = verifySentrySignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects invalid or tampered Sentry signature", () => {
    const invalidSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const isValid = verifySentrySignature(payload, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it("rejects null or missing Sentry signature header", () => {
    expect(verifySentrySignature(payload, null, secret)).toBe(false);
    expect(verifySentrySignature(payload, "", secret)).toBe(false);
  });

  it("verifies valid GitHub sha256 signature prefix", () => {
    const digest = crypto
      .createHmac("sha256", secret)
      .update(Buffer.from(payload, "utf-8"))
      .digest("hex");
    const header = `sha256=${digest}`;

    expect(verifyGitHubSignature(payload, header, secret)).toBe(true);
    expect(verifyGitHubSignature(payload, `sha256=wrong`, secret)).toBe(false);
  });
});
