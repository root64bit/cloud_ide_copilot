"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace("/onboarding");
          router.refresh();
        } else {
          setMessage("Account created. Confirm your email, then sign in.");
          setMode("login");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#070A10] px-4">
      <Card className="w-full max-w-md border-[#1E293B] bg-[#0B1018] shadow-2xl">
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
            <CardTitle className="text-white">{mode === "login" ? "Sign in to OQVEN" : "Create your OQVEN account"}</CardTitle>
            <p className="text-xs text-[#94A3B8] mt-1">Access your AI engineering workspaces and release gates.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-[#EF4444]">{error}</p>}
            {message && <p className="text-xs text-[#22C55E]">{message}</p>}
            <Button className="w-full bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold" type="submit" isLoading={loading}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <button className="mt-4 text-xs text-[#94A3B8] hover:text-[#00E5FF] transition-colors" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
