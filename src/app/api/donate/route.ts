import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { apiError, dbError } from "@/lib/api-error";

const MIN_AMOUNT_UAH = 1;
const MAX_AMOUNT_UAH = 1_000_000;
const M2_PER_UAH = 21_833_000_000 / 1_000_000_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = rateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED", retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body.", 400, "INVALID_JSON");
  }

  const { name, amountUah } = body as { name?: unknown; amountUah?: unknown };

  if (typeof name !== "string" || name.trim().length < 1) {
    return apiError("Name is required.", 422, "VALIDATION_ERROR");
  }
  if (name.trim().length > 100) {
    return apiError("Name must be 100 characters or fewer.", 422, "VALIDATION_ERROR");
  }
  if (typeof amountUah !== "number" || !Number.isInteger(amountUah)) {
    return apiError("Amount must be a whole number.", 422, "VALIDATION_ERROR");
  }
  if (amountUah < MIN_AMOUNT_UAH) {
    return apiError(`Minimum amount is ${MIN_AMOUNT_UAH} ₴.`, 422, "VALIDATION_ERROR");
  }
  if (amountUah > MAX_AMOUNT_UAH) {
    return apiError(`Maximum amount is ${MAX_AMOUNT_UAH.toLocaleString()} ₴.`, 422, "VALIDATION_ERROR");
  }

  let donation;
  try {
    donation = await prisma.donation.create({
      data: {
        name: name.trim(),
        amount: amountUah * 100,
        squareM2: parseFloat((amountUah * M2_PER_UAH).toFixed(4)),
        status: "pending",
      },
    });
  } catch {
    return dbError();
  }

  // --- ЗАГЛУШКА: замість реального Monobank invoice ---
  const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/mock-pay?donationId=${donation.id}`;
  // Коли буде MONOBANK_TOKEN — замінити цей блок на реальний виклик
  // ---------------------------------------------------

  return NextResponse.json({ invoiceUrl, donationId: donation.id }, { status: 201 });
}
