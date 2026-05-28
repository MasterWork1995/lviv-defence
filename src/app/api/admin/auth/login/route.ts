import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { apiError } from "@/lib/api-error";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (
      typeof login !== "string" ||
      typeof password !== "string" ||
      !process.env.ADMIN_PASSWORD_HASH
    ) {
      return apiError("Invalid credentials", 401, "UNAUTHORIZED");
    }

    const loginMatch = login === process.env.ADMIN_LOGIN;

    // ADMIN_PASSWORD_HASH зберігається як base64 щоб уникнути $ інтерполяції dotenv-expand
    const hashB64 = process.env.ADMIN_PASSWORD_HASH ?? "";
    const hash = Buffer.from(hashB64, "base64").toString("utf8");

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, hash);
    } catch (err) {
      console.error("[login] bcrypt.compare failed:", err);
      return apiError("Internal error", 500, "INTERNAL_ERROR");
    }

    if (!loginMatch || !passwordMatch) {
      return apiError("Invalid credentials", 401, "UNAUTHORIZED");
    }

    const session = await getSession();
    session.isAdmin = true;
    try {
      await session.save();
    } catch (err) {
      console.error("[login] session.save failed:", err);
      return apiError("Internal error", 500, "INTERNAL_ERROR");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return apiError("Internal error", 500, "INTERNAL_ERROR");
  }
}
