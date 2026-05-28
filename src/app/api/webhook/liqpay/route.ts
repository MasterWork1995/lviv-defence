import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { apiError, dbError } from "@/lib/api-error";

const SUCCESS_STATUSES = new Set(["success"]);
const CANCEL_STATUSES = new Set(["failure", "reversed", "error"]);

function verifySignature(data: string, signature: string, privateKey: string): boolean {
  const expected = createHash("sha1")
    .update(privateKey + data + privateKey)
    .digest("base64");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  let formData: URLSearchParams;
  try {
    const text = await req.text();
    formData = new URLSearchParams(text);
  } catch {
    return apiError("Failed to read request body.", 400, "INVALID_JSON");
  }

  const data = formData.get("data");
  const signature = formData.get("signature");

  if (!data || !signature)
    return apiError("Missing data or signature.", 422, "VALIDATION_ERROR");

  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  if (privateKey && !verifySignature(data, signature, privateKey))
    return apiError("Invalid signature.", 401, "UNAUTHORIZED");

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as Record<string, unknown>;
  } catch {
    return apiError("Invalid payload.", 400, "INVALID_JSON");
  }

  const orderId = payload["order_id"];
  const status = payload["status"];

  if (typeof orderId !== "string" || !orderId)
    return apiError("Missing order_id.", 422, "VALIDATION_ERROR");
  if (typeof status !== "string" || !status)
    return apiError("Missing status.", 422, "VALIDATION_ERROR");

  let donation;
  try {
    donation = await prisma.donation.findUnique({ where: { id: orderId } });
  } catch {
    return dbError();
  }

  if (!donation || donation.status !== "pending")
    return NextResponse.json({ ok: true });

  try {
    if (SUCCESS_STATUSES.has(status)) {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.donation.findFirst({
          where: { name: { equals: donation.name, mode: "insensitive" }, status: "paid" },
          orderBy: { createdAt: "asc" },
        });
        if (existing) {
          await tx.donation.update({
            where: { id: existing.id },
            data: { amount: existing.amount + donation.amount, squareM2: existing.squareM2 + donation.squareM2 },
          });
          await tx.donation.delete({ where: { id: donation.id } });
        } else {
          await tx.donation.update({ where: { id: donation.id }, data: { status: "paid" } });
        }
        const setting = await tx.setting.findUnique({ where: { key: "collected_uah" } });
        const current = parseInt(setting?.value ?? "0", 10);
        await tx.setting.upsert({
          where: { key: "collected_uah" },
          update: { value: String(current + donation.amount) },
          create: { key: "collected_uah", value: String(donation.amount) },
        });
      });
      revalidatePath("/api/settings");
      revalidatePath("/api/donations");
      revalidatePath("/");
    } else if (CANCEL_STATUSES.has(status)) {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: "cancelled" } });
    }
  } catch {
    return dbError();
  }

  return NextResponse.json({ ok: true });
}
