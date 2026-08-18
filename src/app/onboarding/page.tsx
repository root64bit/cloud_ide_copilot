"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const autoSlug = useMemo(() => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48), [name]);
  const [slugOverride, setSlugOverride] = useState("");
  const slug = slugOverride || autoSlug;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create organization");
      router.replace(`/${data.organization.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Unable to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-background px-4">
      <Card className="w-full max-w-lg border-primary/20">
        <CardHeader className="space-y-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-primary"><Building2 className="w-5 h-5" /></div>
          <div>
            <CardTitle>Create your engineering organization</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Projects, incidents, workspaces, audit evidence, and usage remain tenant-scoped.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Organization name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="URL slug" value={slug} onChange={(e) => setSlugOverride(e.target.value.toLowerCase())} required />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading}>Create organization</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
