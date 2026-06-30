"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AppHeader, type AppHeaderActive } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

const APP_ROUTES = ["dashboard", "query", "wiki", "compile", "settings"];

function appHeaderActiveFromSegment(segment: string): AppHeaderActive {
  if (segment === "dashboard" || segment === "query" || segment === "wiki" || segment === "compile" || segment === "settings") {
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

function DashboardRouteSkeleton() {
  return (
    <main className="container-focused flex min-h-[calc(100vh-73px)] flex-col gap-6 py-8">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-7 w-[min(70vw,320px)] rounded-lg" />
            <Skeleton className="mt-3 h-4 w-[min(78vw,560px)] rounded-md" />
          </div>
          <div className="w-full max-w-[280px]">
            <Skeleton className="h-3 w-40 rounded-md" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0">
          <Skeleton className="h-6 w-44 rounded-md" />
          <Skeleton variant="chart" className="mt-4 h-[290px] rounded-xl" />
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="card" className={index === 4 ? "h-[86px] rounded-xl sm:col-span-2" : "h-[86px] rounded-xl"} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.68fr)]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton variant="card" className="h-[220px] rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton variant="card" className="h-[220px] rounded-xl" />
        </div>
      </section>
    </main>
  );
}

function QueryRouteSkeleton() {
  return (
    <main className="grid min-h-[calc(100vh-73px)] bg-auth-bg md:grid-cols-[246px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[0.08] bg-white/[0.015] p-4 md:block">
        <Skeleton className="h-8 w-36 rounded-md" />
        <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        <Skeleton className="mt-8 h-3 w-28 rounded-md" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <section className="flex min-w-0 flex-col justify-between px-5 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4">
          <Skeleton variant="avatar" className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-[min(80vw,520px)] rounded-md" />
          <div className="mt-5 flex w-full max-w-xl flex-wrap justify-center gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-[min(44vw,230px)] rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="mx-auto h-[104px] w-full max-w-3xl rounded-2xl" />
      </section>
    </main>
  );
}

function WorkspaceRouteSkeleton() {
  return (
    <main className="container-focused min-h-[calc(100vh-73px)] space-y-7 py-8">
      <div>
        <Skeleton className="h-8 w-[min(64vw,300px)] rounded-lg" />
        <Skeleton className="mt-3 h-4 w-[min(78vw,560px)] rounded-md" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
        <div className="space-y-5">
          <Skeleton variant="card" className="h-[270px] rounded-xl" />
          <Skeleton variant="card" className="h-[220px] rounded-xl" />
        </div>
        <div className="space-y-5">
          <Skeleton variant="card" className="h-[190px] rounded-xl" />
          <Skeleton variant="card" className="h-[360px] rounded-xl" />
        </div>
      </div>
    </main>
  );
}

function AppRouteSkeleton({ routeSegment }: { routeSegment: string }) {
  if (routeSegment === "dashboard") return <DashboardRouteSkeleton />;
  if (routeSegment === "query") return <QueryRouteSkeleton />;
  return <WorkspaceRouteSkeleton />;
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
      <AppRouteSkeleton routeSegment={routeSegment} />
    </div>
  );
}
