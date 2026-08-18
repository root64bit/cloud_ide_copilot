import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectIntegrationRepo, ProjectRepo } from "@/lib/supabase/repositories";
import { getTenantPageContext } from "@/server/tenant/context";
import { Bot, Cpu, Github, Server, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function configured(value?: string) {
  return Boolean(value && value.trim());
}

export default async function SettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const projects = await ProjectRepo.listByOrg(tenant.organizationId);
  const integrationPairs = await Promise.all(projects.map(async (project: any) => ({
    project,
    github: await ProjectIntegrationRepo.findByProjectAndProvider(project.id, "github"),
    sentry: await ProjectIntegrationRepo.findByProjectAndProvider(project.id, "sentry"),
  })));

  const githubProjectCount = integrationPairs.filter((row) => row.github).length;
  const sentryProjectCount = integrationPairs.filter((row) => row.sentry).length;
  const openRouterReady = configured(process.env.OPENROUTER_API_KEY);
  const openHandsReady = configured(process.env.OPENHANDS_API_KEY) && configured(process.env.OPENHANDS_API_URL);
  const triggerReady = configured(process.env.TRIGGER_SECRET_KEY);
  const vercelDiscoveryReady = configured(process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN);

  return (
    <div className="max-w-3xl space-y-6">
      <div><h2 className="text-xl font-bold tracking-tight">Organization Settings & Integrations</h2><p className="text-xs text-muted-foreground mt-0.5">Truthful readiness status only. Secrets remain server-side and are never displayed here.</p></div>

      <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><Github className="w-4 h-4" />GitHub App</CardTitle><Badge variant={githubProjectCount > 0 ? "success" : "outline"}>{githubProjectCount > 0 ? `${githubProjectCount} project(s)` : "No project connected"}</Badge></div></CardHeader><CardContent className="text-xs text-muted-foreground">GitHub installation access is stored per connected project. The application uses short-lived installation tokens for repository operations.</CardContent></Card>

      <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><Server className="w-4 h-4" />Vercel</CardTitle><Badge variant={vercelDiscoveryReady ? "success" : "outline"}>{vercelDiscoveryReady ? "Deployment discovery configured" : "Deployment token not configured"}</Badge></div></CardHeader><CardContent className="text-xs text-muted-foreground">Vercel-hosted Sandbox calls use deployment identity/OIDC where available. Vercel deployment discovery currently uses the configured platform token/team for the MVP.</CardContent></Card>

      <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><Bot className="w-4 h-4 text-primary" />AI Runtime</CardTitle><Badge variant={openRouterReady && openHandsReady && triggerReady ? "success" : "warning"}>{openRouterReady && openHandsReady && triggerReady ? "Core AI configured" : "Configuration incomplete"}</Badge></div></CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded bg-secondary/30"><span className="block text-[10px] text-muted-foreground">OpenRouter</span><span className="font-semibold">{openRouterReady ? "Configured" : "Missing key"}</span></div>
          <div className="p-2.5 rounded bg-secondary/30"><span className="block text-[10px] text-muted-foreground">OpenHands Cloud</span><span className="font-semibold">{openHandsReady ? "Configured" : "Incomplete"}</span></div>
          <div className="p-2.5 rounded bg-secondary/30"><span className="block text-[10px] text-muted-foreground">Trigger.dev</span><span className="font-semibold">{triggerReady ? "Configured" : "Missing key"}</span></div>
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" />Sentry Mapping</CardTitle><Badge variant={sentryProjectCount > 0 ? "success" : "outline"}>{sentryProjectCount} mapped</Badge></div></CardHeader><CardContent className="text-xs text-muted-foreground">Incoming Sentry webhooks fail closed unless their project identifier maps to a connected platform project.</CardContent></Card>

      <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Cpu className="w-4 h-4 text-amber-400" />Project Memory</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">TencentDB Agent Memory remains deliberately deferred until the core repair/release path is fully proven.</CardContent></Card>
    </div>
  );
}
