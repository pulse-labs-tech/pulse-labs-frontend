"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Parse current locale from pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0] === "en" ? "en" : "vi";

  const changeLocale = (newLocale: "vi" | "en") => {
    if (newLocale === currentLocale) return;

    // Persist locale setting in cookie for middleware/proxy to read next time
    document.cookie = `pulse_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Calculate redirect path
    let newPathname = "";
    if (segments.length > 0 && (segments[0] === "vi" || segments[0] === "en")) {
      newPathname = "/" + [newLocale, ...segments.slice(1)].join("/");
    } else {
      newPathname = `/${newLocale}${pathname === "/" ? "" : pathname}`;
    }

    startTransition(() => {
      router.push(newPathname);
      router.refresh();
    });
  };

  return (
    <div className="relative inline-flex items-center rounded-full bg-white/[0.04] p-0.5 border border-white/[0.08] backdrop-blur-md">
      <button
        onClick={() => changeLocale("vi")}
        disabled={isPending}
        className={`relative px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
          currentLocale === "vi"
            ? "bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
            : "text-auth-text-2 hover:text-white border border-transparent"
        } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        VI
      </button>
      <button
        onClick={() => changeLocale("en")}
        disabled={isPending}
        className={`relative px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
          currentLocale === "en"
            ? "bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
            : "text-auth-text-2 hover:text-white border border-transparent"
        } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        EN
      </button>
    </div>
  );
}
