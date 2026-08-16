import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Creates a server-side Supabase client with admin/service-role privileges.
 * Strictly used in protected backend services and API routes after server-side RBAC validation.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Mock / In-Memory store for tests and offline development
 */
export class InMemoryDatabase {
  private static instance: InMemoryDatabase;
  public organizations = new Map<string, any>();
  public members = new Map<string, any>();
  public projects = new Map<string, any>();
  public incidents = new Map<string, any>();
  public workspaces = new Map<string, any>();
  public aiAnalyses = new Map<string, any>();
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
    this.incidents.clear();
    this.workspaces.clear();
    this.aiAnalyses.clear();
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

    this.members.set(`${orgId}:user_owner`, {
      id: "mem_1",
      organization_id: orgId,
      user_id: "user_owner",
      role: "owner",
      created_at: new Date().toISOString(),
    });

    this.members.set(`${orgId}:user_admin`, {
      id: "mem_2",
      organization_id: orgId,
      user_id: "user_admin",
      role: "admin",
      created_at: new Date().toISOString(),
    });

    this.members.set(`${orgId}:user_engineer`, {
      id: "mem_3",
      organization_id: orgId,
      user_id: "user_engineer",
      role: "engineer",
      created_at: new Date().toISOString(),
    });

    this.members.set(`${orgId}:user_viewer`, {
      id: "mem_4",
      organization_id: orgId,
      user_id: "user_viewer",
      role: "viewer",
      created_at: new Date().toISOString(),
    });

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
      first_seen_at: new Date(Date.now() - 7200000).toISOString(),
      last_seen_at: new Date(Date.now() - 300000).toISOString(),
      occurrence_count: 42,
      sanitized_metadata: {
        stacktrace: [
          { filename: "src/lib/checkout/pricing.ts", lineno: 48, function: "calculateTotal" },
          { filename: "src/app/api/checkout/route.ts", lineno: 112, function: "POST" },
        ],
        tags: { browser: "Chrome 122", os: "iOS 17.3" },
      },
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 300000).toISOString(),
    });
  }
}
