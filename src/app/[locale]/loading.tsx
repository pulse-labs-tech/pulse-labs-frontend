"use client";

import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const APP_ROUTES = ["dashboard", "query", "research", "wiki", "compile", "settings"];

function AppHeaderSkeleton() {
  return (
    <>
      <header className="app-glass-header fixed inset-x-0 top-0 z-50 border-b border-white/[0.08]">
        <div className="mx-auto grid min-h-[72px] w-full max-w-[1760px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6 xl:gap-5 2xl:px-8">
          <Skeleton className="h-11 w-12 rounded-2xl sm:w-48" />
          <div className="hidden justify-center md:flex">
            <Skeleton className="h-11 w-[min(42vw,560px)] rounded-[18px]" />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="hidden h-10 w-28 rounded-2xl xl:block" />
            <Skeleton className="h-10 w-20 rounded-2xl" />
          </div>
        </div>
      </header>
      <div className="h-[72px] shrink-0" aria-hidden="true" />
    </>
  );
}

function PageHeadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-32 rounded-md" />
      <Skeleton className="h-8 w-[min(72vw,340px)] rounded-lg" />
      <Skeleton className="h-4 w-[min(80vw,500px)] rounded-md" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-auth-border bg-auth-surface p-5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-[min(75%,520px)]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
        <Skeleton variant="chart" className="h-[320px] rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="card" className="h-[150px] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton variant="card" className="h-[280px] rounded-xl" />
        <Skeleton variant="card" className="h-[280px] rounded-xl" />
      </div>
    </div>
  );
}

function QuerySkeleton() {
  return (
    <div className="grid min-h-[calc(100vh-72px)] md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden border-r border-auth-border p-4 md:block">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-col justify-between p-5 sm:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-7 pt-8">
          <Skeleton className="h-5 w-36" />
          <Skeleton variant="text" rows={3} />
          <div className="ml-auto w-[min(78%,520px)]">
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <Skeleton variant="text" rows={5} />
        </div>
        <Skeleton className="mx-auto mt-10 h-16 w-full max-w-3xl rounded-2xl" />
      </div>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <main className="container-focused flex-1 space-y-7 py-8">
      <PageHeadingSkeleton />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
        <div className="space-y-4">
          <Skeleton variant="card" className="h-[220px] rounded-xl" />
          <Skeleton variant="card" className="h-[180px] rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="card" className="h-[180px] rounded-xl" />
          <Skeleton variant="card" className="h-[320px] rounded-xl" />
        </div>
      </div>
    </main>
  );
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

export default function Loading() {
  const pathname = usePathname();
  const routeSegment = pathname.split("/").filter(Boolean)[1] ?? "";
  const isAppRoute = APP_ROUTES.includes(routeSegment);

  if (!isAppRoute) {
    return (
      <div role="status" aria-live="polite" aria-label="Đang tải trang">
        <PublicPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text" role="status" aria-live="polite" aria-label="Đang tải trang">
      <AppHeaderSkeleton />
      {routeSegment === "query" ? (
        <QuerySkeleton />
      ) : (
        <div className="flex min-h-[calc(100vh-72px)] flex-col">
          {routeSegment === "dashboard" ? (
            <main className="container-focused flex-1 py-8">
              <DashboardSkeleton />
            </main>
          ) : (
            <WorkspaceSkeleton />
          )}
        </div>
      )}
      <div className="fixed inset-x-4 bottom-3 h-14 rounded-full border border-white/[0.07] bg-auth-surface/90 md:hidden" aria-hidden="true" />
    </div>
  );
}
