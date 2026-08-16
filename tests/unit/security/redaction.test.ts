import { describe, expect, it } from "vitest";
import { redactObject, redactSecrets } from "@/lib/security/redaction";

describe("Secret Redaction Engine", () => {
  it("redacts Bearer and Authorization tokens", () => {
    const raw = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID";
    const sanitized = redactSecrets(raw);
    expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(sanitized).toContain("Bearer [REDACTED_TOKEN]");
  });

  it("redacts OpenRouter and OpenAI API keys", () => {
    const raw = ["sk-or-v1-", "0123456789abcdef".repeat(4)].join("");
    const sanitized = redactSecrets(raw);
    expect(sanitized).toBe("[REDACTED_API_KEY]");
  });

  it("redacts GitHub personal access and installation tokens", () => {
    const raw = ["ghp_", "1234567890abcdefghijklmnopqrstuvwxyzAB"].join("");
    const sanitized = redactSecrets(raw);
    expect(sanitized).toBe("[REDACTED_GITHUB_TOKEN]");
  });

  it("redacts Stripe production and test keys", () => {
    const raw = ["sk_live_", "51AbcDefGhiJklMnoPqrStuVwXyz123456"].join("");
    const sanitized = redactSecrets(raw);
    expect(sanitized).toBe("[REDACTED_STRIPE_KEY]");
  });

  it("redacts database connection passwords from connection strings", () => {
    const raw = "postgres://postgres:superSecretP@ssword123@db.example.com:5432/production";
    const sanitized = redactSecrets(raw);
    expect(sanitized).toBe("postgres://postgres:[REDACTED_PASSWORD]@db.example.com:5432/production");
    expect(sanitized).not.toContain("superSecretP@ssword123");
  });

  it("redacts RSA private keys", () => {
    const raw = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----";
    const sanitized = redactSecrets(raw);
    expect(sanitized).toBe("[REDACTED_PRIVATE_KEY]");
  });

  it("deeply redacts nested objects and sensitive JSON keys", () => {
    const payload = {
      user: "alice",
      token: "secret-token-value-12345",
      password: "my-plain-password",
      meta: {
        apiKey: ["sk-or-v1-", "0123456789abcdef".repeat(4)].join(""),
        stacktrace: "Error at postgres://admin:pass123@db.internal:5432/prod",
      },
    };

    const sanitized = redactObject(payload);
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.meta.apiKey).toBe("[REDACTED]");
    expect(sanitized.meta.stacktrace).not.toContain("pass123");
  });
});
