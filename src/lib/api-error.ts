import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "DB_ERROR"
  | "INTERNAL_ERROR";

export function apiError(
  message: string,
  status: number,
  code: ApiErrorCode
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}

export function dbError(): NextResponse {
  return apiError("Database temporarily unavailable. Please try again.", 503, "DB_ERROR");
}
