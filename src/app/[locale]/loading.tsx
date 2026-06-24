"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AppHeader, type AppHeaderActive } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

const APP_ROUTES = ["dashboard", "query", "research", "wiki", "compile", "settings"];

function appHeaderActiveFromSegment(segment: string): AppHeaderActive {
  if (segment === "dashboard" || segment === "query" || segment === "research" || segment === "wiki" || segment === "compile" || segment === "settings") {
    return segment;
  }

  return "dashboard";
}

function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-auth-bg px-5 py-6 text-auth-text sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Skeleton className="h-11 w-44 rounded-2xl" />
        <Skeleton className="h-11 w-72 rounded-2xl" />
      </div>
      <main className="mx-auto mt-20 w-full max-w-6xl">
        <Skeleton className="h-14 w-[min(80vw,520px)] rounded-xl" />
        <Skeleton className="mt-4 h-5 w-[min(82vw,620px)] rounded-md" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Skeleton variant="card" className="h-[300px] rounded-xl" />
          <Skeleton variant="card" className="h-[300px] rounded-xl" />
        </div>
      </main>
    </div>
  );
}

function AppRouteTransition() {
  return (
    <main className="min-h-[calc(100vh-73px)] bg-auth-bg" aria-hidden="true">
      <div className="container-focused py-4">
        <div className="h-px overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-1/3 animate-[route-loading-slide_1.1s_ease-in-out_infinite] rounded-full bg-white/35" />
        </div>
      </div>
    </main>
  );
}

export default function Loading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] ?? "vi";
  const routeSegment = segments[1] ?? "";
  const isAppRoute = APP_ROUTES.includes(routeSegment);
  const selectedRoleKbId = searchParams.get("roleKbId") || searchParams.get("roleId") || searchParams.get("role_id");

  if (!isAppRoute) {
    return (
      <div role="status" aria-live="polite" aria-label="Đang tải trang">
        <PublicPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text" role="status" aria-live="polite" aria-label="Đang tải trang">
      <AppHeader active={appHeaderActiveFromSegment(routeSegment)} locale={locale} selectedRoleKbId={selectedRoleKbId} />
      <AppRouteTransition />
    </div>
  );
}
