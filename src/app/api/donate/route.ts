import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { apiError, dbError } from "@/lib/api-error";
import { getSettings } from "@/lib/data";

const MIN_AMOUNT_UAH = 1;
const MAX_AMOUNT_UAH = 1_000_000_000;

type Provider = "monobank" | "liqpay";

async function createMonobankInvoice(
  donationId: string,
  name: string,
  amountKopecks: number
): Promise<{ pageUrl: string; invoiceId: string }> {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) throw new Error("MONOBANK_TOKEN not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const res = await fetch("https://api.monobank.ua/api/merchant/invoice/create", {
    method: "POST",
    headers: { "X-Token": token, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference: donationId,
        destination: "Купол Львівщини",
        comment: `${name} — ${amountKopecks / 100} ₴`,
      },
      redirectUrl: `${appUrl}/donate/success?id=${donationId}`,
      webHookUrl: `${appUrl}/api/webhook/monobank`,
      validity: 3600,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Monobank error ${res.status}: ${err}`);
  }

  return res.json() as Promise<{ pageUrl: string; invoiceId: string }>;
}

function createLiqpayPayload(
  donationId: string,
  name: string,
  amountUah: number
): { data: string; signature: string } {
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new Error("LIQPAY keys not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const payload = {
    version: 3,
    public_key: publicKey,
    action: "pay",
    amount: amountUah,
    currency: "UAH",
    description: `Купол Львівщини — ${name}`,
    order_id: donationId,
    server_url: `${appUrl}/api/webhook/liqpay`,
    result_url: `${appUrl}/donate/success?id=${donationId}`,
    language: "uk",
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");

  return { data, signature };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests.", code: "RATE_LIMITED", retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("Invalid request body.", 400, "INVALID_JSON"); }

  const { name, amountUah, provider } = body as {
    name?: unknown;
    amountUah?: unknown;
    provider?: unknown;
  };

  if (typeof name !== "string" || name.trim().length < 1)
    return apiError("Name is required.", 422, "VALIDATION_ERROR");
  if (name.trim().length > 100)
    return apiError("Name must be 100 characters or fewer.", 422, "VALIDATION_ERROR");
  if (typeof amountUah !== "number" || !Number.isInteger(amountUah) || amountUah < MIN_AMOUNT_UAH)
    return apiError(`Minimum amount is ${MIN_AMOUNT_UAH} ₴.`, 422, "VALIDATION_ERROR");
  if (amountUah > MAX_AMOUNT_UAH)
    return apiError(`Maximum amount is ${MAX_AMOUNT_UAH.toLocaleString()} ₴.`, 422, "VALIDATION_ERROR");
  if (provider !== "monobank" && provider !== "liqpay")
    return apiError("provider must be 'monobank' or 'liqpay'.", 422, "VALIDATION_ERROR");

  const { m2PerUah } = await getSettings();

  let donation: { id: string };
  try {
    donation = await prisma.donation.create({
      data: {
        name: name.trim(),
        amount: amountUah,
        squareM2: parseFloat((amountUah * m2PerUah).toFixed(4)),
        status: "pending",
        provider: provider as Provider,
      },
      select: { id: true },
    });
  } catch {
    return dbError();
  }

  if (provider === "monobank") {
    try {
      const { pageUrl, invoiceId } = await createMonobankInvoice(
        donation.id, name.trim(), amountUah * 100
      );
      await prisma.donation.update({
        where: { id: donation.id },
        data: { txId: invoiceId },
      });
      return NextResponse.json({ invoiceUrl: pageUrl, donationId: donation.id }, { status: 201 });
    } catch (e) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: "cancelled" } });
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("not configured"))
        return apiError("Monobank payments are not configured yet.", 503, "INTERNAL_ERROR");
      return apiError("Failed to create Monobank invoice.", 502, "INTERNAL_ERROR");
    }
  }

  // LiqPay
  try {
    const { data, signature } = createLiqpayPayload(donation.id, name.trim(), amountUah);
    await prisma.donation.update({
      where: { id: donation.id },
      data: { txId: `liqpay_${donation.id}` },
    });
    return NextResponse.json({ liqpayData: data, liqpaySignature: signature, donationId: donation.id }, { status: 201 });
  } catch (e) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "cancelled" } });
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not configured"))
      return apiError("LiqPay payments are not configured yet.", 503, "INTERNAL_ERROR");
    return apiError("Failed to create LiqPay payment.", 502, "INTERNAL_ERROR");
  }
}
