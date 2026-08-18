import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

function requireServerEnv(name: string, aliases: string[] = []): string {
  const keys = [name, ...aliases];
  for (const key of keys) {
    const value = process.env[key];
    if (value && !value.startsWith("placeholder")) return value;
  }
  throw new Error(`Missing required server environment variable: ${name}`);
}

function getSupabaseUrl(): string {
  return requireServerEnv("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"]);
}

function getSupabasePublishableKey(): string {
  return requireServerEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
}

/**
 * Service-role client. This bypasses RLS and must only be used after explicit
 * server-side authorization checks or for trusted machine-to-machine workflows.
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseSecret = requireServerEnv("SUPABASE_SECRET_KEY", ["SUPABASE_SERVICE_ROLE_KEY"]);

  return createSupabaseClient<Database>(supabaseUrl, supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Cookie-aware Supabase client for Server Components, Server Actions and Route
 * Handlers. User identity returned by `auth.getUser()` is revalidated by the
 * Supabase Auth service and is safe to use for authorization decisions.
 */
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Session refresh is
          // handled by middleware; Route Handlers/Server Actions can write them.
        }
      },
    },
  });
}

/**
 * In-memory store is intentionally test-only. Runtime repositories only use it
 * when NODE_ENV=test or ALLOW_MOCK_PROVIDERS=true is explicitly configured outside production.
 */
export class InMemoryDatabase {
  private static instance: InMemoryDatabase;
  public organizations = new Map<string, any>();
  public members = new Map<string, any>();
  public projects = new Map<string, any>();
  public projectIntegrations = new Map<string, any>();
  public incidents = new Map<string, any>();
  public workspaces = new Map<string, any>();
  public aiAnalyses = new Map<string, any>();
  public repairArtifacts = new Map<string, any>();
  public commandRuns = new Map<string, any>();
  public pullRequests = new Map<string, any>();
  public deployments = new Map<string, any>();
  public auditEvents = new Array<any>();
  public memories = new Map<string, any>();

  private constructor() {
    this.seedDefault();
  }

  public static getInstance(): InMemoryDatabase {
    if (!InMemoryDatabase.instance) {
      InMemoryDatabase.instance = new InMemoryDatabase();
    }
    return InMemoryDatabase.instance;
  }

  public reset() {
    this.organizations.clear();
    this.members.clear();
    this.projects.clear();
    this.projectIntegrations.clear();
    this.incidents.clear();
    this.workspaces.clear();
    this.aiAnalyses.clear();
    this.repairArtifacts.clear();
    this.commandRuns.clear();
    this.pullRequests.clear();
    this.deployments.clear();
    this.auditEvents.length = 0;
    this.memories.clear();
    this.seedDefault();
  }

  private seedDefault() {
    const orgId = "00000000-0000-0000-0000-000000000001";
    this.organizations.set(orgId, {
      id: orgId,
      name: "Acme Engineering",
      slug: "acme-corp",
      created_by: "user_owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    for (const [id, userId, role] of [
      ["mem_1", "user_owner", "owner"],
      ["mem_2", "user_admin", "admin"],
      ["mem_3", "user_engineer", "engineer"],
      ["mem_4", "user_viewer", "viewer"],
    ] as const) {
      this.members.set(`${orgId}:${userId}`, {
        id,
        organization_id: orgId,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const projectId = "10000000-0000-0000-0000-000000000001";
    this.projects.set(projectId, {
      id: projectId,
      organization_id: orgId,
      name: "OneDealer",
      slug: "onedealer",
      description: "Automotive dealership management platform",
      repository_provider: "github",
      repository_owner: "acme-inc",
      repository_name: "onedealer",
      repository_id: 84920192,
      default_branch: "main",
      deployment_provider: "vercel",
      vercel_project_id: "prj_onedealer_prod",
      vercel_team_id: "team_acme",
      production_domain: "onedealer.example.com",
      package_manager: "npm",
      install_command: "npm ci",
      test_command: "npm test",
      lint_command: "npm run lint",
      typecheck_command: "npx tsc --noEmit",
      build_command: "npm run build",
      dev_command: "npm run dev",
      dev_port: 3000,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.projectIntegrations.set(`${projectId}:github`, {
      id: "30000000-0000-0000-0000-000000000001",
      project_id: projectId,
      provider: "github",
      external_id: "123456",
      config_encrypted: { installationId: 123456 },
      status: "connected",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const incidentId = "20000000-0000-0000-0000-000000000001";
    this.incidents.set(incidentId, {
      id: incidentId,
      organization_id: orgId,
      project_id: projectId,
      provider: "sentry",
      external_issue_id: "ISSUE-9284",
      external_event_id: "evt_98234",
      title: "TypeError: Cannot read properties of undefined (reading 'discountCode')",
      level: "error",
      environment: "production",
      release: "v1.4.2",
      commit_sha: "a9f82d1c5e4b7890123456789abcdef012345678",
      culprit: "src/lib/checkout/pricing.ts in calculateTotal",
      status: "unresolved",
      first_seen_at: new Date(Date.now() - 7_200_000).toISOString(),
      last_seen_at: new Date(Date.now() - 300_000).toISOString(),
      occurrence_count: 42,
      sanitized_metadata: {
        stacktrace: [
          { filename: "src/lib/checkout/pricing.ts", lineno: 48, function: "calculateTotal" },
          { filename: "src/app/api/checkout/route.ts", lineno: 112, function: "POST" },
        ],
        tags: { browser: "Chrome 122", os: "iOS 17.3" },
      },
      created_at: new Date(Date.now() - 7_200_000).toISOString(),
      updated_at: new Date(Date.now() - 300_000).toISOString(),
    });
  }
}
