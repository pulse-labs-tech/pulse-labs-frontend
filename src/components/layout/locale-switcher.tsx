"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { LineIcon } from "@/components/shared/line-icon";

interface LocaleSwitcherProps {
  id?: string;
}

export function LocaleSwitcher({ id = "default" }: LocaleSwitcherProps) {
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
    <div className="relative inline-flex items-center gap-1 rounded-full bg-white/[0.02] p-0.5 border border-white/[0.07] hover:border-white/[0.13] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md transition-all duration-300">
      {/* Globe Icon */}
      <motion.div
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="pl-2 pr-1 text-auth-text-3 flex items-center justify-center cursor-pointer max-[480px]:hidden"
      >
        <LineIcon name="world" className="h-3.5 w-3.5 text-auth-text-3/70 hover:text-auth-text-2 transition-colors duration-300" />
      </motion.div>
      
      <div className="relative flex items-center bg-black/25 p-0.5 rounded-full border border-white/[0.03]">
        {/* VI Button */}
        <button
          onClick={() => changeLocale("vi")}
          disabled={isPending}
          className={`relative px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none select-none sm:px-3.5 ${
            currentLocale === "vi"
              ? "text-white"
              : "text-auth-text-3/80 hover:text-white"
          } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {currentLocale === "vi" && (
            <motion.span
              layoutId={`activeLocaleBg-${id}`}
              className="absolute inset-0 rounded-full bg-white/[0.10] border border-white/[0.12]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">VI</span>
        </button>

        {/* EN Button */}
        <button
          onClick={() => changeLocale("en")}
          disabled={isPending}
          className={`relative px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center justify-center focus:outline-none select-none sm:px-3.5 ${
            currentLocale === "en"
              ? "text-white"
              : "text-auth-text-3/80 hover:text-white"
          } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {currentLocale === "en" && (
            <motion.span
              layoutId={`activeLocaleBg-${id}`}
              className="absolute inset-0 rounded-full bg-white/[0.10] border border-white/[0.12]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">EN</span>
        </button>
      </div>
    </div>
  );
}
