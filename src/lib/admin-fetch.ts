"use client";

export async function adminFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401) {
    window.location.href = "/admin/login";
    return new Promise(() => {});
  }
  return res;
}
