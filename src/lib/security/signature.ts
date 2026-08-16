import crypto from "crypto";

/**
 * Validates Sentry Webhook HMAC-SHA256 signature.
 * Sentry transmits signature via `sentry-hook-signature` or `sentry-hook-resource` headers.
 */
export function verifySentrySignature(
  rawPayload: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    const payloadBuffer = typeof rawPayload === "string" ? Buffer.from(rawPayload, "utf-8") : rawPayload;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadBuffer)
      .digest("hex");

    const expectedBuffer = Buffer.from(computedSignature, "hex");
    const actualBuffer = Buffer.from(signatureHeader.replace(/^sha256=/, "").trim(), "hex");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates GitHub Webhook HMAC-SHA256 signature (x-hub-signature-256).
 */
export function verifyGitHubSignature(
  rawPayload: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    const payloadBuffer = typeof rawPayload === "string" ? Buffer.from(rawPayload, "utf-8") : rawPayload;
    const hmac = crypto.createHmac("sha256", secret);
    const computedDigest = `sha256=${hmac.update(payloadBuffer).digest("hex")}`;

    const expectedBuffer = Buffer.from(computedDigest);
    const actualBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}
