import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("Missing id.", 422, "VALIDATION_ERROR");

  try {
    const donation = await prisma.donation.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!donation) return apiError("Not found.", 404, "NOT_FOUND");
    return NextResponse.json({ status: donation.status });
  } catch {
    return NextResponse.json({ status: "pending" });
  }
}
