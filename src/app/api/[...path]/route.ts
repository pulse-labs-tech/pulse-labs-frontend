import { NextRequest, NextResponse } from "next/server";
import { authFetch } from "@/lib/authenticated-client";

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  // Handle async/sync params compatibly for Next.js App Router versions
  const resolvedParams = await (params as any);
  const pathSegments = resolvedParams.path;
  const path = "/" + pathSegments.join("/");
  
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const targetPath = `${path}${searchParams ? "?" + searchParams : ""}`;

  const method = request.method;
  let body: string | undefined = undefined;

  if (method !== "GET" && method !== "HEAD") {
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // Body is empty or not JSON
    }
  }

  try {
    const res = await authFetch<any>(targetPath, {
      method,
      body,
      noRedirect: true,
    });
    return NextResponse.json(res);
  } catch (error) {
    console.error(`Proxy error on ${method} ${targetPath}:`, error);
    return NextResponse.json({
      status: "0",
      error_code: "SERVER_ERROR",
      msg: "Lỗi kết nối proxy.",
      data: null,
    }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
