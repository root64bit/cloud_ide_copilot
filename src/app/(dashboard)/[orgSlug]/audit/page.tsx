import { AuditEventList } from "@/components/audit/audit-event-list";
import { AuditLogger } from "@/lib/audit/logger";
import React from "react";

export default async function AuditTrailPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const orgId = "00000000-0000-0000-0000-000000000001";

  const events = await AuditLogger.getEvents(orgId, 50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Security Audit Trail</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Immutable event stream capturing all workspace creation, commands, AI repairs, PRs, and human approvals.
        </p>
      </div>

      <AuditEventList events={events} />
    </div>
  );
}
