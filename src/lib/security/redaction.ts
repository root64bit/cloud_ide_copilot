/**
 * Multi-pattern secret redaction utility.
 * Sanitizes strings, objects, stack traces, and command logs before persistence,
 * display, or transmission to external AI models / logs.
 */

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp; mask: string }> = [
  // Bearer and Authorization tokens
  {
    name: "Bearer Token",
    regex: /bearer\s+([a-zA-Z0-9_\-\.]{15,})/gi,
    mask: "Bearer [REDACTED_TOKEN]",
  },
  {
    name: "Basic Auth",
    regex: /basic\s+([a-zA-Z0-9+/=]{15,})/gi,
    mask: "Basic [REDACTED_BASIC_AUTH]",
  },
  // JWT Tokens (3 base64url segments)
  {
    name: "JSON Web Token",
    regex: /\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g,
    mask: "[REDACTED_JWT]",
  },
  // GitHub App / PAT Tokens (ghp_, gho_, ghu_, ghs_, ghr_)
  {
    name: "GitHub Token",
    regex: /\b(gh[pousr]_[a-zA-Z0-9]{36,255})\b/g,
    mask: "[REDACTED_GITHUB_TOKEN]",
  },
  // Vercel API / Sandbox Tokens
  {
    name: "Vercel Token",
    regex: /\b(vercel_[a-zA-Z0-9_-]{20,}|[a-zA-Z0-9]{24,32}(?=\s*(?:token|secret)))\b/gi,
    mask: "[REDACTED_VERCEL_TOKEN]",
  },
  // OpenRouter / OpenAI API Keys (sk-or-v1-..., sk-...)
  {
    name: "OpenRouter / OpenAI Key",
    regex: /\b(sk-or-v1-[a-f0-9]{64}|sk-[a-zA-Z0-9]{32,64})\b/g,
    mask: "[REDACTED_API_KEY]",
  },
  // Stripe API Keys (sk_live_, rk_live_, sk_test_)
  {
    name: "Stripe Key",
    regex: /\b(sk_live_[a-zA-Z0-9]{24,}|rk_live_[a-zA-Z0-9]{24,}|sk_test_[a-zA-Z0-9]{24,})\b/g,
    mask: "[REDACTED_STRIPE_KEY]",
  },
  // Database Connection Strings with Passwords
  {
    name: "Database URL",
    regex: /(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/([^:\s\/]+):(.*)@([^@\/\s:]+)/gi,
    mask: "$1://$2:[REDACTED_PASSWORD]@$4",
  },
  // Supabase Service Role / Anon Keys
  {
    name: "Supabase Service Key",
    regex: /service_role_key\s*[:=]\s*["']?([a-zA-Z0-9_\-\.]{20,})["']?/gi,
    mask: 'service_role_key: "[REDACTED_SERVICE_KEY]"',
  },
  // AWS Access Key & Secret
  {
    name: "AWS Access Key",
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    mask: "[REDACTED_AWS_KEY]",
  },
  // Generic Private Keys (RSA, EC, PGP, OPENSSH)
  {
    name: "Private Key Header",
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[^]+?-----END [A-Z ]*PRIVATE KEY-----/g,
    mask: "[REDACTED_PRIVATE_KEY]",
  },
  // Password / Secret in JSON or query params
  {
    name: "Password Field",
    regex: /"(password|secret|apiKey|api_key|client_secret|accessToken|access_token|privateKey)":\s*"([^"]+)"/gi,
    mask: '"$1": "[REDACTED]"',
  },
  // Cookie and Set-Cookie headers
  {
    name: "Cookie Value",
    regex: /(?:cookie|set-cookie):\s*([^;\r\n]+)/gi,
    mask: "cookie: [REDACTED_COOKIE]",
  },
];

/**
 * Redacts known sensitive patterns from a raw string.
 */
export function redactSecrets(input: string): string {
  if (!input || typeof input !== "string") return input;

  let sanitized = input;
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern.regex, pattern.mask);
  }
  return sanitized;
}

/**
 * Deeply traverses an object or array and redacts all string values and sensitive keys.
 */
export function redactObject<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return redactSecrets(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactObject(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("key") ||
        lowerKey.includes("auth") ||
        lowerKey.includes("cookie")
      ) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactObject(value);
      }
    }
    return result as T;
  }

  return input;
}
