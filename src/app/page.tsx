import { FaqAndComparisonSection } from "@/components/landing/faq-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { OrganizationMemberRepo, OrganizationRepo } from "@/lib/supabase/repositories";
import {
  ArrowRight,
  Bot,
  Box,
  CheckCircle2,
  Code2,
  GitPullRequest,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  let shouldRedirectUrl: string | null = null;
  let userOrgSlug: string | null = null;
  try {
    const user = await getAuthenticatedUser();
    const memberships = await OrganizationMemberRepo.listByUser(user.id);
    if (memberships.length > 0) {
      const org = await OrganizationRepo.findById(memberships[0].organization_id);
      if (org) {
        shouldRedirectUrl = `/${org.slug}`;
        userOrgSlug = org.slug;
      }
    }
    if (!shouldRedirectUrl) {
      shouldRedirectUrl = "/onboarding";
    }
  } catch {
    // Unauthenticated visitors will see full landing page with conversion CTAs
  }

  if (shouldRedirectUrl) {
    redirect(shouldRedirectUrl);
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F8FAFC] flex flex-col selection:bg-[#00E5FF]/20 selection:text-[#00E5FF]">
      {/* Top Glassmorphic Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#0B1018]/80 backdrop-blur-xl border-b border-[#1E293B] h-16 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-wider text-white flex items-center gap-1.5 font-mono">
              OQVEN
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                PRO
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#94A3B8]">
            <a href="#features" className="hover:text-[#00E5FF] transition-colors">Capabilities</a>
            <a href="#copilot-demo" className="hover:text-[#00E5FF] transition-colors">Copilot IDE</a>
            <a href="#pricing" className="hover:text-[#00E5FF] transition-colors">Pricing</a>
            <a href="#comparison" className="hover:text-[#00E5FF] transition-colors">Comparison</a>
            <a href="#faq" className="hover:text-[#00E5FF] transition-colors">FAQ</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {userOrgSlug ? (
            <Link
              href={`/${userOrgSlug}`}
              className="bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold"
            >
              Open Dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs text-[#CBD5E1] hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-24 pb-16 space-y-16">
        <section className="relative px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Subtle Glow Background */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-mono mb-6">
            <span className="pulse-dot" />
            AUTONOMOUS & INTERACTIVE AI ENGINEERING
          </div>

          {/* Main Title & Brand Tagline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white">
            Give it a task. <br className="hidden sm:block" />
            <span className="text-[#00E5FF] drop-shadow-[0_0_24px_rgba(0,229,255,0.35)]">
              Get working code.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#94A3B8] max-w-2xl font-normal leading-relaxed">
            OQVEN is the AI-native engineering copilot with an interactive chat IDE, isolated Vercel Sandboxes, deterministic test validation, and human-in-the-loop release gates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={userOrgSlug ? `/${userOrgSlug}/workspaces` : "/onboarding"}
              className="w-full sm:w-auto bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold text-sm px-6 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all hover:scale-102"
            >
              <Sparkles className="w-4 h-4" />
              Launch Cloud Workspace
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto bg-[#090D16] border border-[#1E293B] hover:border-[#00E5FF]/50 text-[#CBD5E1] hover:text-white text-sm px-6 py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all font-mono"
            >
              <Zap className="w-3.5 h-3.5 text-[#00E5FF]" />
              View Pricing Plans
            </a>
          </div>

          {/* Social Proof & Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl pt-8 border-t border-[#1E293B]/60 text-left">
            <div className="p-3 bg-[#0B1018] rounded-lg border border-[#1E293B]">
              <div className="text-xs text-[#64748B] font-mono">Agent Backend</div>
              <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#00E5FF]" /> OpenHands Cloud
              </div>
            </div>
            <div className="p-3 bg-[#0B1018] rounded-lg border border-[#1E293B]">
              <div className="text-xs text-[#64748B] font-mono">Execution Boundary</div>
              <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-[#22C55E]" /> Vercel Sandbox
              </div>
            </div>
            <div className="p-3 bg-[#0B1018] rounded-lg border border-[#1E293B]">
              <div className="text-xs text-[#64748B] font-mono">Validation Gate</div>
              <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" /> Deterministic Tests
              </div>
            </div>
            <div className="p-3 bg-[#0B1018] rounded-lg border border-[#1E293B]">
              <div className="text-xs text-[#64748B] font-mono">Release Authority</div>
              <div className="text-sm font-semibold text-white mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" /> Human PR Approval
              </div>
            </div>
          </div>
        </section>

        {/* Live Copilot IDE Teaser Section (Stitch Screen 1) */}
        <section id="copilot-demo" className="px-6 lg:px-12 py-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              The OQVEN Cloud Copilot Workspace
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2 font-mono">
              3-Pane High-Density IDE: File Explorer • Split Diff & Sandbox Terminal • Interactive AI Copilot Chat
            </p>
          </div>

          <div className="rounded-xl border border-[#1E293B] bg-[#090D16] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Window Header */}
            <div className="h-10 bg-[#0B1018] border-b border-[#1E293B] px-4 flex items-center justify-between text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60" />
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]/60" />
                </div>
                <span className="font-mono text-[#94A3B8] ml-2">oqven-workspace / task-482</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#00E5FF]">
                <span className="pulse-dot" /> Live Sandbox Connected
              </div>
            </div>

            {/* 3-Pane Layout Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Explorer */}
              <div className="lg:col-span-2 border-r border-[#1E293B] bg-[#0B1018]/60 p-3 hidden sm:block font-mono text-xs text-[#94A3B8] space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-[#64748B] mb-2">Explorer</div>
                <div className="text-[#00E5FF] flex items-center gap-1.5">📁 src</div>
                <div className="pl-4 text-[#CBD5E1] flex items-center gap-1.5">📁 services</div>
                <div className="pl-8 text-white bg-[#00E5FF]/10 px-1.5 py-1 rounded border border-[#00E5FF]/20 flex items-center gap-1.5">
                  📄 auth.service.ts
                </div>
                <div className="pl-8 text-[#94A3B8] flex items-center gap-1.5">📄 auth.service.test.ts</div>
                <div className="pl-4 text-[#CBD5E1] flex items-center gap-1.5">📁 providers</div>
              </div>

              {/* Code & Diff Viewer */}
              <div className="lg:col-span-6 bg-[#05070B] flex flex-col font-mono text-xs">
                <div className="h-8 border-b border-[#1E293B] bg-[#090D16] px-4 flex items-center text-[#CBD5E1] text-[11px] gap-2">
                  <Code2 className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>src &gt; services &gt; auth.service.ts (AI Fix Applied)</span>
                </div>
                <div className="p-4 space-y-1 text-[#CBD5E1] leading-relaxed overflow-x-auto flex-1 font-mono">
                  <div className="text-[#64748B]">42  async refreshSession(token: string): Promise&lt;Session&gt; &#123;</div>
                  <div className="text-[#64748B]">43    try &#123;</div>
                  <div className="text-[#64748B]">44      const decoded = await this.jwt.verify(token);</div>
                  <div className="diff-remove px-2 py-0.5 text-[#EF4444] rounded">
                    45 -    const session = await this.cache.get(`session:$&#123;decoded.id&#125;`);
                  </div>
                  <div className="diff-add px-2 py-0.5 text-[#22C55E] rounded">
                    45 +    const sessionKey = `session:$&#123;decoded.id&#125;`;
                  </div>
                  <div className="diff-add px-2 py-0.5 text-[#22C55E] rounded">
                    46 +    const lock = await this.redis.lock(`lock:refresh:$&#123;decoded.id&#125;`, 5000);
                  </div>
                  <div className="diff-add px-2 py-0.5 text-[#22C55E] rounded">
                    47 +    if (!lock) throw new Error(&apos;Refresh already in progress&apos;);
                  </div>
                  <div className="text-[#64748B]">48      const session = await this.cache.get(sessionKey);</div>
                  <div className="text-[#64748B]">49      if (!session) throw new UnauthorizedException();</div>
                </div>

                {/* Mini Terminal Pane */}
                <div className="border-t border-[#1E293B] bg-[#0B1018] p-3 text-[11px]">
                  <div className="flex items-center justify-between text-[#64748B] mb-1.5">
                    <span className="flex items-center gap-1.5 text-[#22C55E] font-semibold">
                      <Terminal className="w-3.5 h-3.5" /> Sandbox Terminal (PASS)
                    </span>
                    <span>All 40 tests passed (13 suites)</span>
                  </div>
                  <div className="text-[#94A3B8] font-mono">$ vitest run &bull; PASS auth.service.test.ts (84ms)</div>
                </div>
              </div>

              {/* AI Copilot Chat Pane */}
              <div className="lg:col-span-4 border-l border-[#1E293B] bg-[#0B1018]/90 p-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-white">AI Copilot</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded">
                      OpenHands + Sonnet
                    </span>
                  </div>

                  <div className="bg-[#111827] rounded-lg p-3 border border-[#1E293B] text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-[#00E5FF] font-semibold text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      TASK-482: Fix Auth Race Condition
                    </div>
                    <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                      Acquired distributed lock on session refresh to resolve race conditions. Applied and verified in Sandbox.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 px-2 py-0.5 rounded font-mono">
                        Tests Passed
                      </span>
                      <span className="text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 px-2 py-0.5 rounded font-mono">
                        PR Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Box */}
                <div className="mt-4 pt-3 border-t border-[#1E293B]">
                  <div className="flex gap-1.5 mb-2 font-mono text-[10px]">
                    <span className="bg-[#090D16] border border-[#1E293B] px-1.5 py-0.5 rounded text-[#00E5FF]">
                      @auth.service.ts
                    </span>
                  </div>
                  <div className="bg-[#05070B] border border-[#1E293B] rounded-lg p-2.5 flex items-center justify-between text-xs text-[#64748B]">
                    <span>Ask Copilot or prompt a change...</span>
                    <span className="bg-[#00E5FF] text-[#00363D] font-bold text-[10px] px-2 py-1 rounded">
                      Send
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section id="features" className="px-6 lg:px-12 py-16 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Engineered for Real Production Safety
            </h2>
            <p className="text-sm text-[#94A3B8] mt-2">
              AI writes code. Isolated Sandboxes validate it. Humans hold the release keys.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#0B1018] rounded-xl border border-[#1E293B] hover:border-[#00E5FF]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] mb-4 group-hover:scale-105 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Isolated Vercel Sandboxes</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Every repair runs in an ephemeral, isolated container. Code modifications and tests never leak to production branches until verified.
              </p>
            </div>

            <div className="p-6 bg-[#0B1018] rounded-xl border border-[#1E293B] hover:border-[#00E5FF]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] mb-4 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Deterministic Test Gates</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Allowlisted linting, typechecking, unit tests, and production build validation run automatically inside the sandbox before creating PRs.
              </p>
            </div>

            <div className="p-6 bg-[#0B1018] rounded-xl border border-[#1E293B] hover:border-[#00E5FF]/40 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Exact Release Observation</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                Workspaces complete only when a verified Vercel production deployment matching the exact GitHub merge commit SHA is observed as READY.
              </p>
            </div>
          </div>
        </section>

        {/* Tiered Pricing Plans Section */}
        <PricingSection userOrgSlug={userOrgSlug} />

        {/* Comparison Matrix, FAQs, and Bottom Conversion CTA */}
        <FaqAndComparisonSection userOrgSlug={userOrgSlug} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0B1018] py-8 px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#F8FAFC]">OQVEN</span>
          <span>&mdash; Give it a task. Get working code.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/onboarding" className="hover:text-white transition-colors">Create Organization</Link>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a>
          <span>&copy; {new Date().getFullYear()} OQVEN Platform</span>
        </div>
      </footer>
    </div>
  );
}
