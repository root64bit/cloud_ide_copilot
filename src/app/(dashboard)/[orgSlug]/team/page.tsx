import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationMemberRepo } from "@/lib/supabase/repositories";
import { getTenantPageContext } from "@/server/tenant/context";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const { tenant } = await getTenantPageContext(orgSlug);
  const members = await OrganizationMemberRepo.listByOrg(tenant.organizationId);
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold tracking-tight">Team Members & RBAC Roles</h2><p className="text-xs text-muted-foreground mt-0.5">Memberships persisted for this organization. Invitations are not wired yet.</p></div>
      <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Active Organization Members</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {members.length === 0 ? <div className="p-6 text-xs text-muted-foreground">No memberships found.</div> : members.map((member: any) => (
            <div key={member.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div className="min-w-0"><h4 className="font-semibold">Member</h4><p className="text-[11px] text-muted-foreground font-mono truncate">{member.user_id}</p></div>
              <Badge variant={member.role === "owner" ? "default" : member.role === "admin" ? "warning" : member.role === "engineer" ? "success" : "secondary"} className="font-mono text-[10px]">{member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
