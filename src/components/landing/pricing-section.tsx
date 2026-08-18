"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Smartphone, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

export function PricingSection({ userOrgSlug }: { userOrgSlug?: string | null }) {
  const [annualBilling, setAnnualBilling] = useState(true);

  const plans = [
    {
      name: "Starter",
      badge: "Hobbyist",
      priceMonthly: 0,
      priceAnnual: 0,
      priceMzn: 0,
      description: "Ideal for indie developers exploring autonomous AI debugging and code repair.",
      features: [
        "10 Autonomous AI repairs / mo",
        "Unlimited interactive Copilot chat",
        "5 hours Vercel Sandbox compute",
        "Standard OpenRouter model tier",
        "Community support & docs",
        "GitHub repository integration",
      ],
      ctaText: "Start Free",
      ctaHref: userOrgSlug ? `/${userOrgSlug}/workspaces` : "/onboarding",
      popular: false,
      isMpesaAvailable: false,
    },
    {
      name: "Pro Engineer",
      badge: "Most Popular",
      priceMonthly: 29,
      priceAnnual: 24,
      priceMzn: 1850,
      description: "For professional developers who want autonomous incident triage and fast sandbox repairs.",
      features: [
        "50 Autonomous AI repairs / mo",
        "Unlimited interactive Copilot chat with @file AST context",
        "30 hours isolated Vercel Sandbox compute",
        "Claude 3.7 Sonnet & DeepSeek R1 models",
        "Real-time Sentry incident webhook triage",
        "Deterministic test validation gates",
        "Vercel Preview deployment observation",
        "Priority worker queue execution",
      ],
      ctaText: "Upgrade to Pro (M-Pesa / Card)",
      ctaHref: "/checkout?plan=pro",
      popular: true,
      isMpesaAvailable: true,
    },
    {
      name: "Team & Scale",
      badge: "Fast Teams",
      priceMonthly: 99,
      priceAnnual: 79,
      priceMzn: 6300,
      description: "For engineering teams automating bug triage, release verification, and compliance.",
      features: [
        "Unlimited AI repairs & Copilot chat",
        "150 hours isolated Vercel Sandbox compute",
        "Multi-tenant RBAC (Admin, Developer, Viewer)",
        "Dedicated GitHub App installation binding",
        "Tamper-evident audit trail & compliance export",
        "Custom OpenRouter LLM bring-your-own-key",
        "Exact merge commit SHA release observer",
        "Priority Slack & email support",
      ],
      ctaText: "Start Team Trial (M-Pesa / Card)",
      ctaHref: "/checkout?plan=team",
      popular: false,
      isMpesaAvailable: true,
    },
  ];

  return (
    <section id="pricing" className="px-6 lg:px-12 py-20 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" /> TRANSPARENT DEVELOPER PRICING
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Predictable plans for high-velocity teams
        </h2>
        <p className="mt-4 text-[#94A3B8] text-sm sm:text-base">
          Give OQVEN a task. Let isolated Sandboxes write and validate your code. Instant activation via Vodacom M-Pesa or Global Cards.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-[#0B1018] border border-[#1E293B]">
          <button
            type="button"
            onClick={() => setAnnualBilling(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !annualBilling
                ? "bg-[#00E5FF] text-[#00363D] font-bold shadow-sm"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setAnnualBilling(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              annualBilling
                ? "bg-[#00E5FF] text-[#00363D] font-bold shadow-sm"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-[#22C55E]/20 text-[#22C55E] font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const price = annualBilling ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                plan.popular
                  ? "bg-[#0B1018] border-2 border-[#00E5FF] shadow-[0_0_32px_rgba(0,229,255,0.2)] scale-102 lg:-translate-y-2"
                  : "bg-[#090D16] border border-[#1E293B] hover:border-[#1E293B]/80"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00E5FF] text-[#00363D] text-[10px] font-bold font-mono uppercase px-3 py-1 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white font-mono">{plan.name}</h3>
                  {!plan.popular && (
                    <span className="text-[11px] font-mono text-[#64748B] bg-[#0B1018] px-2 py-0.5 rounded border border-[#1E293B]">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                    ${price}
                  </span>
                  <span className="text-xs text-[#64748B] font-mono">
                    / user / month
                  </span>
                </div>

                {plan.priceMzn > 0 && (
                  <div className="text-[11px] text-[#00E5FF] font-mono mb-3 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-[#22C55E]" />
                    <span>M-Pesa: {plan.priceMzn.toLocaleString()} MZN</span>
                  </div>
                )}

                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                  {plan.description}
                </p>

                <div className="space-y-3 pt-4 border-t border-[#1E293B] text-xs font-mono">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[#CBD5E1]">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#1E293B]">
                <Link
                  href={plan.ctaHref}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    plan.popular
                      ? "bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 shadow-[0_0_16px_rgba(0,229,255,0.3)] hover:scale-101"
                      : "bg-[#111827] text-white hover:bg-[#1E293B] border border-[#1E293B]"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {plan.ctaText}
                </Link>
                <div className="text-center mt-2 text-[10px] text-[#64748B] font-mono flex items-center justify-center gap-2">
                  {plan.isMpesaAvailable ? (
                    <span className="text-[#22C55E]">🇲🇿 Vodacom M-Pesa Push Accepted</span>
                  ) : (
                    <span>No credit card required</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
