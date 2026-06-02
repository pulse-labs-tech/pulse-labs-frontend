import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    // 1. Get access token from HttpOnly cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("pulse_at")?.value;

    if (!token) {
      return NextResponse.json(
        {
          status: "0",
          error_code: "UNAUTHORIZED",
          msg: "Chưa đăng nhập hoặc phiên làm việc hết hạn.",
          data: null,
        },
        { status: 401 }
      );
    }

    // 2. Read query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        {
          status: "0",
          error_code: "VALIDATION_ERROR",
          msg: "Thiếu query parameter 'query'.",
          data: null,
        },
        { status: 422 }
      );
    }

    // 3. Construct backend URL
    const RESEARCH_API_BASE = process.env.NEXT_PUBLIC_RESEARCH_API_URL || "https://cardboard-desolate-zoologist.ngrok-free.dev";
    const backendUrl = new URL(`${RESEARCH_API_BASE}/research/stream`);
    
    // Forward query
    backendUrl.searchParams.set("query", query);
    
    // Forward optional params if present
    const roleId = searchParams.get("role_id");
    if (roleId) backendUrl.searchParams.set("role_id", roleId);
    
    const documentId = searchParams.get("document_id");
    if (documentId) backendUrl.searchParams.set("document_id", documentId);
    
    const topK = searchParams.get("top_k");
    if (topK) backendUrl.searchParams.set("top_k", topK);
    
    // Support multi-filter domain_filters
    const domainFilters = searchParams.getAll("domain_filters");
    domainFilters.forEach((filter) => {
      backendUrl.searchParams.append("domain_filters", filter);
    });

    // 4. Fetch the streaming endpoint from Backend
    const backendResponse = await fetch(backendUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    });

    if (!backendResponse.ok) {
      // Return HTTP error as json if request failed before stream starts
      const status = backendResponse.status;
      try {
        const errJson = await backendResponse.json();
        return NextResponse.json(errJson, { status });
      } catch {
        return NextResponse.json(
          {
            status: "0",
            error_code: "SERVER_ERROR",
            msg: `Lỗi kết nối stream từ máy chủ backend (HTTP ${status}).`,
            data: null,
          },
          { status }
        );
      }
    }

    // 5. Stream the response directly to client
    return new Response(backendResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in proxy servers (like Nginx)
      },
    });
  } catch (error) {
    console.error("Research stream proxy error:", error);
    return NextResponse.json(
      {
        status: "0",
        error_code: "SERVER_ERROR",
        msg: "Lỗi hệ thống khi thiết lập kết nối stream.",
        data: null,
      },
      { status: 500 }
    );
  }
}
