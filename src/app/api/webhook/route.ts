import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiError, dbError } from "@/lib/api-error";

const SUCCESS_STATUSES = new Set(["success"]);
const CANCEL_STATUSES = new Set(["failure", "reversed", "expired"]);

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return apiError("Failed to read request body.", 400, "INVALID_JSON");
  }

  const signature = req.headers.get("x-sign");
  const secret = process.env.MONOBANK_WEBHOOK_SECRET;

  if (secret) {
    if (!signature) {
      return apiError("Missing X-Sign header.", 401, "UNAUTHORIZED");
    }
    if (!verifySignature(rawBody, signature, secret)) {
      return apiError("Invalid signature.", 401, "UNAUTHORIZED");
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("Invalid JSON.", 400, "INVALID_JSON");
  }

  const { invoiceId, status } = payload as { invoiceId?: unknown; status?: unknown };

  if (typeof invoiceId !== "string" || !invoiceId) {
    return apiError("Missing or invalid invoiceId.", 422, "VALIDATION_ERROR");
  }
  if (typeof status !== "string" || !status) {
    return apiError("Missing or invalid status.", 422, "VALIDATION_ERROR");
  }

  let donation;
  try {
    donation = await prisma.donation.findUnique({ where: { txId: invoiceId } });
  } catch {
    return dbError();
  }

  // Повертаємо 200 навіть якщо донат не знайдено — Monobank не повинен ретраїти
  if (!donation || donation.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  try {
    if (SUCCESS_STATUSES.has(status)) {
      await prisma.$transaction(async (tx) => {
        await tx.donation.update({
          where: { id: donation.id },
          data: { status: "paid" },
        });

        const setting = await tx.setting.findUnique({ where: { key: "collected_kopecks" } });
        const current = parseInt(setting?.value ?? "0", 10);

        await tx.setting.upsert({
          where: { key: "collected_kopecks" },
          update: { value: String(current + donation.amount) },
          create: { key: "collected_kopecks", value: String(donation.amount) },
        });
      });

      revalidatePath("/api/settings");
      revalidatePath("/api/donations");
      revalidatePath("/");
    } else if (CANCEL_STATUSES.has(status)) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "cancelled" },
      });
    }
  } catch {
    return dbError();
  }

  return NextResponse.json({ ok: true });
}
