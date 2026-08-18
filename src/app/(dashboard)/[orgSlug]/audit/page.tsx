import { AuditEventList } from "@/components/audit/audit-event-list";
import { AuditLogger } from "@/lib/audit/logger";
import { getTenantPageContext } from "@/server/tenant/context";

export const dynamic = "force-dynamic";

export default async function AuditTrailPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const events = await AuditLogger.getEvents(tenant.organizationId, 100);
  return <div className="space-y-6"><div><h2 className="text-xl font-bold tracking-tight">Security Audit Trail</h2><p className="text-xs text-muted-foreground mt-0.5">Persisted organization-scoped events for privileged engineering operations.</p></div><AuditEventList events={events} /></div>;
}
