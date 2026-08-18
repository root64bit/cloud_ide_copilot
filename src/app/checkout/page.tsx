"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Cpu,
  Loader2,
  Lock,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

interface PlanOption {
  id: string;
  name: string;
  badge: string;
  priceMzn: number;
  priceUsd: number;
  description: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: "pro",
    name: "Pro Engineer",
    badge: "Most Popular",
    priceMzn: 1850,
    priceUsd: 29,
    description: "50 autonomous repair tasks & 30h fast Sandbox compute with Claude 3.7 & DeepSeek R1.",
    features: [
      "50 Autonomous repairs / mo",
      "Unlimited interactive Copilot chat",
      "30 hours isolated Vercel Sandbox compute",
      "Claude 3.7 Sonnet & DeepSeek R1",
      "Real-time Sentry webhook triage",
      "Deterministic test gates",
    ],
  },
  {
    id: "team",
    name: "Team & Scale",
    badge: "Fast Teams",
    priceMzn: 6300,
    priceUsd: 99,
    description: "Unlimited AI repairs, 150h compute, multi-tenant RBAC, and compliance audit exports.",
    features: [
      "Unlimited AI repairs & Copilot chat",
      "150 hours isolated Vercel Sandbox compute",
      "Multi-tenant RBAC & team permissions",
      "Dedicated GitHub App binding",
      "Tamper-evident audit trail export",
      "Priority worker queue execution",
    ],
  },
  {
    id: "credits_100",
    name: "AI Compute Booster",
    badge: "On-Demand Pack",
    priceMzn: 500,
    priceUsd: 8,
    description: "15 extra autonomous repair runs & 10 hours of isolated Vercel Sandbox execution.",
    features: [
      "15 Autonomous repair runs",
      "10 hours Vercel Sandbox compute",
      "Never expires",
      "Applies instantly to active workspace",
    ],
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams.get("plan") || "pro";

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Payment progress state
  const [paymentStep, setPaymentStep] = useState<"idle" | "ussd_prompt" | "polling" | "success" | "failed">("idle");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [thirdPartyRef, setThirdPartyRef] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [pollCount, setPollCount] = useState<number>(0);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[0];

  // Auto poll status if in ussd_prompt / polling state
  useEffect(() => {
    if (paymentStep !== "ussd_prompt" && paymentStep !== "polling") return;
    if (!thirdPartyRef) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        setPollCount((prev) => prev + 1);
        const res = await fetch("/api/mpesa/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queryRef: thirdPartyRef,
            thirdPartyRef: thirdPartyRef,
          }),
        });
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && (data.transactionStatus === "Completed" || data.responseCode === "INS-0")) {
          setPaymentStep("success");
          if (data.transactionId) setTransactionId(data.transactionId);
          clearInterval(interval);
        } else if (data.responseCode === "INS-5") {
          setPaymentStep("failed");
          setError("Payment cancelled by user on phone.");
          clearInterval(interval);
        } else if (data.responseCode === "INS-10") {
          setPaymentStep("failed");
          setError("Insufficient M-Pesa balance in client account.");
          clearInterval(interval);
        }
      } catch (pollErr) {
        // Continue polling until timeout or success
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [paymentStep, thirdPartyRef]);

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatusMessage("");

    // Validate phone number format (258 + 9 digits or 9 digits)
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setError("Please enter a valid 9-digit Mozambique phone number (e.g., 84 123 4567 or 258 84 123 4567).");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/mpesa/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.priceMzn,
          msisdn: phoneNumber,
          planId: selectedPlan.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.responseDescription || data.error || "M-Pesa payment request failed.");
      }

      setTransactionId(data.transactionId || null);
      setConversationId(data.conversationId || null);
      setThirdPartyRef(data.thirdPartyRef || data.submittedPayload?.thirdPartyRef || null);
      setStatusMessage(data.responseDescription || "Payment request sent to phone.");
      setPaymentStep("ussd_prompt");
    } catch (err: any) {
      setError(err?.message || "Unable to initiate M-Pesa payment. Please try again.");
      setPaymentStep("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPaymentStep("idle");
    setError(null);
    setTransactionId(null);
    setThirdPartyRef(null);
    setPollCount(0);
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-[#1E293B] bg-[#0B1018]/80 backdrop-blur-xl px-6 lg:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to OQVEN
        </Link>
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
          <div className="w-6 h-6 rounded bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          OQVEN Checkout
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#22C55E]">
          <ShieldCheck className="w-4 h-4" /> 256-bit Encrypted
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <Badge variant="outline" className="text-[#00E5FF] border-[#00E5FF]/30 mb-3 bg-[#00E5FF]/10 font-mono">
            VODACOM M-PESA GATEWAY
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Instant M-Pesa Subscription Checkout
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-2">
            Enter your Vodacom M-Pesa mobile number to receive an instant USSD PIN push notification on your device.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Plan Picker & Order Summary */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#64748B]">1. Select Your Plan</h2>
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      if (paymentStep === "idle" || paymentStep === "failed") {
                        setSelectedPlanId(plan.id);
                      }
                    }}
                    className={`rounded-xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0B1018] border-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.15)]"
                        : "bg-[#090D16] border-[#1E293B] hover:border-[#1E293B]/80 opacity-75"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-white font-mono">{plan.name}</span>
                      <span className="text-[10px] font-mono bg-[#00E5FF]/10 text-[#00E5FF] px-2 py-0.5 rounded border border-[#00E5FF]/20">
                        {plan.badge}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-xl font-extrabold text-white font-mono">
                        {plan.priceMzn.toLocaleString()} MZN
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        (~${plan.priceUsd} USD)
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{plan.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Plan Features Overview */}
            <div className="rounded-xl border border-[#1E293B] bg-[#090D16] p-4 text-xs font-mono space-y-2">
              <div className="text-[11px] text-[#64748B] uppercase font-semibold">Included in {selectedPlan.name}:</div>
              {selectedPlan.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[#CBD5E1]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Payment Form & USSD Push Simulator */}
          <div className="lg:col-span-7">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#64748B] mb-4">
              2. M-Pesa Payment Details
            </h2>

            {paymentStep === "idle" && (
              <Card className="border-[#1E293B] bg-[#0B1018] shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">Vodacom M-Pesa Push</CardTitle>
                        <p className="text-xs text-[#94A3B8]">Direct C2B payment authorization</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10">
                      Live Gateway
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleInitiatePayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-[#CBD5E1] mb-1.5">
                        M-Pesa Phone Number (Mozambique)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-mono text-[#64748B]">
                          🇲🇿 +258
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="84 123 4567"
                          className="w-full pl-20 pr-4 py-2.5 rounded-lg bg-[#05070B] border border-[#1E293B] focus:border-[#00E5FF] focus:outline-none text-sm font-mono text-white placeholder-[#64748B]"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                        Formats accepted: 84XXXXXXX, 85XXXXXXX, or 25884XXXXXXX.
                      </p>
                    </div>

                    {/* Order Breakdown */}
                    <div className="rounded-lg bg-[#05070B] p-3.5 border border-[#1E293B] space-y-2 text-xs font-mono">
                      <div className="flex justify-between text-[#94A3B8]">
                        <span>Item</span>
                        <span className="text-white">{selectedPlan.name} Subscription</span>
                      </div>
                      <div className="flex justify-between text-[#94A3B8]">
                        <span>Currency</span>
                        <span className="text-white">Mozambican Metical (MZN)</span>
                      </div>
                      <div className="h-px bg-[#1E293B] my-1" />
                      <div className="flex justify-between text-sm font-bold text-white">
                        <span>Total to Charge</span>
                        <span className="text-[#00E5FF]">{selectedPlan.priceMzn.toLocaleString()} MZN</span>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      isLoading={loading}
                      className="w-full bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold text-sm py-6 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Send M-Pesa USSD Push ({selectedPlan.priceMzn.toLocaleString()} MZN)
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B] font-mono">
                      <Lock className="w-3 h-3 text-[#22C55E]" />
                      RSA-Encrypted &bull; No PIN stored &bull; Vodacom Verified
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* USSD Push Waiting / Polling State */}
            {(paymentStep === "ussd_prompt" || paymentStep === "polling") && (
              <Card className="border-[#00E5FF] bg-[#0B1018] shadow-[0_0_32px_rgba(0,229,255,0.2)]">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-lg text-white">Check Your Phone Now</CardTitle>
                  <p className="text-xs text-[#94A3B8]">
                    A Vodacom M-Pesa USSD notification has been dispatched to{" "}
                    <span className="font-mono text-white font-bold">{phoneNumber}</span>.
                  </p>
                </CardHeader>

                <CardContent className="space-y-6 text-center">
                  {/* Phone Screen Mockup */}
                  <div className="max-w-xs mx-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-4 shadow-2xl text-left font-mono text-xs text-zinc-100">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 border-b border-zinc-900 mb-3">
                      <span>Vodacom M-Pesa</span>
                      <span>Push Prompt</span>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <p className="text-zinc-300">
                        Confirm payment of <strong className="text-emerald-400">{selectedPlan.priceMzn} MZN</strong> to{" "}
                        <strong className="text-cyan-400">OQVEN</strong>?
                      </p>
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-center text-zinc-400 text-[10px]">
                        Enter 4-digit M-Pesa PIN on your phone
                      </div>
                    </div>
                  </div>

                  {/* Polling Indicator */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#00E5FF]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Waiting for M-Pesa PIN confirmation... (Check #{pollCount})</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] font-mono">
                      Ref: {thirdPartyRef || "OQVEN-TX"} &bull; Do not close this browser window
                    </p>
                  </div>

                  {/* Simulation Helpers & Cancel Action */}
                  <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentStep("success")}
                      className="text-xs border-[#22C55E]/40 text-[#22C55E] hover:bg-[#22C55E]/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Simulate Confirmed PIN
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="text-xs text-[#94A3B8] hover:text-white"
                    >
                      Change Phone Number
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success State */}
            {paymentStep === "success" && (
              <Card className="border-[#22C55E] bg-[#0B1018] shadow-[0_0_32px_rgba(34,197,94,0.2)] text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Payment Successful!</h2>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-6">
                  Your Vodacom M-Pesa payment of <strong className="text-white">{selectedPlan.priceMzn} MZN</strong> has been confirmed. Your {selectedPlan.name} plan is now active.
                </p>

                <div className="max-w-sm mx-auto rounded-xl bg-[#05070B] border border-[#1E293B] p-4 text-xs font-mono text-left space-y-2 mb-6">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Transaction ID:</span>
                    <span className="text-white font-bold">{transactionId || "DH40L30TAIY"}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Plan Activated:</span>
                    <span className="text-[#00E5FF] font-bold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Amount Paid:</span>
                    <span className="text-[#22C55E] font-bold">{selectedPlan.priceMzn} MZN</span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Gateway:</span>
                    <span className="text-white">Vodacom M-Pesa Moçambique</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/onboarding"
                    className="w-full sm:w-auto bg-[#00E5FF] text-[#00363D] hover:bg-[#00E5FF]/90 font-bold text-xs px-6 py-3 rounded-lg shadow-lg"
                  >
                    Go to Workspace Dashboard
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full sm:w-auto text-xs"
                  >
                    Make Another Payment
                  </Button>
                </div>
              </Card>
            )}

            {/* Failed State */}
            {paymentStep === "failed" && (
              <Card className="border-[#EF4444] bg-[#0B1018] p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/40 text-[#EF4444] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Payment Could Not Complete</h2>
                <p className="text-xs text-[#94A3B8] max-w-md mx-auto mb-6">
                  {error || "The M-Pesa transaction was not confirmed or timed out."}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleReset}
                    className="bg-[#00E5FF] text-[#00363D] font-bold text-xs px-6"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Try Again
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070A10] flex items-center justify-center text-white">
          <Loader2 className="w-6 h-6 animate-spin text-[#00E5FF]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
