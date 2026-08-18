"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Sparkles } from "lucide-react";
import Link from "next/link";
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
    <main className="min-h-screen grid place-items-center bg-[#070A10] px-4">
      <Card className="w-full max-w-lg border-[#1E293B] bg-[#0B1018] shadow-2xl">
        <CardHeader className="space-y-3">
          <Link href="/" className="flex items-center gap-2 mb-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 grid place-items-center text-[#00E5FF] group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono font-bold text-lg text-white">OQVEN</span>
              <p className="text-[10px] text-[#64748B]">Give it a task. Get working code.</p>
            </div>
          </Link>
          <div>
            <CardTitle className="text-white">Create your engineering organization</CardTitle>
            <p className="text-xs text-[#94A3B8] mt-1">Projects, incidents, workspaces, and release gates remain tenant-scoped.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Organization name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="URL slug" value={slug} onChange={(e) => setSlugOverride(e.target.value.toLowerCase())} required />
            {error && <p className="text-xs text-[#EF4444]">{error}</p>}
            <Button type="submit" className="w-full bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold" isLoading={loading}>
              Create Organization
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
