import { NextResponse } from "next/server";

const MINESCOPE_PAY_URL = "https://minescoop-mz.web.app/api/mpesa/pay";

export const dynamic = "force-dynamic";

/**
 * Formats a raw phone string into Vodacom M-Pesa format: 2588XXXXXXXX (12 digits, no '+')
 */
function sanitizeMsisdn(raw: string): string {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  if (!cleaned.startsWith("258") && cleaned.length === 9) {
    cleaned = `258${cleaned}`;
  }
  return cleaned;
}

/**
 * Generates an alphanumeric reference strictly <= 10 chars with NO hyphens
 */
function generateShortRef(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${cleanPrefix}${randomPart}`.slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, msisdn, planId, reference: customRef, thirdPartyRef: customThirdPartyRef } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount. Must be greater than 0 MZN." },
        { status: 400 }
      );
    }

    const cleanMsisdn = sanitizeMsisdn(String(msisdn || ""));
    const isValidMsisdn = /^258\d{9}$/.test(cleanMsisdn);
    if (!isValidMsisdn) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number. Must be a 9-digit Mozambique number (e.g. 258841234567 or 841234567).",
        },
        { status: 400 }
      );
    }

    // Must be max 10 alphanumeric chars without hyphens (M-Pesa INS-21 constraint)
    const reference = (customRef ? String(customRef).replace(/[^A-Za-z0-9]/g, "").slice(0, 10) : generateShortRef("OQV"));
    const thirdPartyRef = (customThirdPartyRef ? String(customThirdPartyRef).replace(/[^A-Za-z0-9]/g, "").slice(0, 10) : generateShortRef("MS"));

    const payload = {
      amount: Math.round(numAmount),
      msisdn: cleanMsisdn,
      reference,
      thirdPartyRef,
    };

    const upstreamResponse = await fetch(MINESCOPE_PAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await upstreamResponse.json();

    return NextResponse.json(
      {
        ...result,
        submittedPayload: {
          amount: payload.amount,
          msisdn: payload.msisdn,
          reference: payload.reference,
          thirdPartyRef: payload.thirdPartyRef,
          planId: planId || "pro",
        },
      },
      { status: upstreamResponse.ok ? 200 : upstreamResponse.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to initiate M-Pesa payment",
      },
      { status: 500 }
    );
  }
}
