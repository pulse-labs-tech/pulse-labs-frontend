"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, BookOpen, FileText, Link2, FileCode, Cpu, CornerDownLeft } from "lucide-react";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { getWikiItemsAction } from "@/app/actions/wiki";
import type { WikiItemCard } from "@/types/wiki";

export function GlobalSearchPalette() {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiItemCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [category, setCategory] = useState<"all" | "files" | "links" | "notes">("all");

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  // Handle item selection (hoisted to prevent declaration-order lint errors)
  const handleSelect = useCallback((itemId: string | number) => {
    setOpen(false);
    startTransition(() => {
      router.push(`/${locale}/wiki/items/${itemId}`);
    });
  }, [router, locale]);

  // Derive filtered results based on selected category
  const filteredResults = results.filter((item) => {
    if (category === "all") return true;
    if (category === "files") {
      return item.sourceType.startsWith("file_");
    }
    if (category === "links") {
      return item.sourceType === "url";
    }
    if (category === "notes") {
      return item.sourceType === "text";
    }
    return true;
  });

  // Keyboard shortcut listener: Ctrl+K / Cmd+K / slash (/)
  useEffect(() => {
    if (!user) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.hasAttribute("contenteditable")
      );

      // Trigger search palette
      if (
        (e.key === "k" && (e.ctrlKey || e.metaKey)) ||
        (e.key === "/" && !isInput)
      ) {
        e.preventDefault();
        setQuery("");
        setResults([]);
        setActiveIndex(0);
        setCategory("all");
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user]);

  // Custom event listener for external button triggers
  useEffect(() => {
    const handleOpenSearch = () => {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setCategory("all");
      setOpen(true);
    };
    window.addEventListener("open-global-search", handleOpenSearch);
    return () => window.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Fetch results when query changes (wrapped asynchronously to prevent cascading setState warnings)
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getWikiItemsAction({ q: query, limit: 8 });
        if (res.status === "1" && res.data?.items) {
          setResults(res.data.items);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Search palette error:", err);
        setResults([]);
      } finally {
        setLoading(false);
        setActiveIndex(0);
      }
    };

    const delayDebounceFn = setTimeout(fetchData, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query, open]);

  // Handle arrow key navigation & Escape
  useEffect(() => {
    if (!open) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredResults[activeIndex]) {
          handleSelect(filteredResults[activeIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [open, filteredResults, activeIndex, handleSelect]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current && filteredResults.length > 0) {
      const activeEl = resultsRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        const container = resultsRef.current;
        const elemTop = activeEl.offsetTop;
        const elemBottom = elemTop + activeEl.clientHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [activeIndex, filteredResults]);

  const getSourceIcon = (type: string) => {
    const size = "h-4 w-4 shrink-0";
    switch (type) {
      case "text":
        return <FileText className={`${size} text-emerald-400`} />;
      case "url":
        return <Link2 className={`${size} text-blue-400`} />;
      case "file_pdf":
        return <FileText className={`${size} text-red-400`} />;
      case "file_txt":
        return <FileText className={`${size} text-slate-400`} />;
      case "file_md":
        return <FileCode className={`${size} text-purple-400`} />;
      case "query_output":
        return <Cpu className={`${size} text-cyan-400`} />;
      default:
        return <BookOpen className={`${size} text-emerald-500`} />;
    }
  };

  // Safe checks for unauthenticated sessions
  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#09090b]/80 backdrop-blur-md"
          />

          {/* Palette Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full max-w-xl bg-auth-surface/95 border border-white/[0.08] rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] relative backdrop-blur-xl flex flex-col z-10 group"
          >
            {/* Top indicator glow */}
            <div className="premium-accent-border premium-accent-border-flow" />

            {/* Input row */}
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-auth-text-3 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={locale === "vi" ? "Tìm kiếm tri thức..." : "Search knowledge..."}
                className="w-full bg-transparent text-auth-text border-0 outline-none text-[14px] py-4.5 pl-11 pr-16 focus:ring-0 placeholder:text-auth-text-3 font-sans"
              />
              
              <div className="absolute right-4 flex items-center gap-1.5 select-none">
                {loading ? (
                  <DotMatrixLoader variant="wave" size="xs" />
                ) : (
                  <span className="text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-auth-text-3">
                    ESC
                  </span>
                )}
              </div>
            </div>

            {/* Category tabs */}
            {query.trim() !== "" && (
              <div className="flex items-center gap-1.5 px-4 pb-2.5 pt-0.5 border-b border-white/[0.04] bg-[#0c0c0e]/10 overflow-x-auto select-none no-scrollbar">
                {[
                  { id: "all", labelVi: "Tất cả", labelEn: "All" },
                  { id: "files", labelVi: "Tài liệu", labelEn: "Files" },
                  { id: "links", labelVi: "Liên kết", labelEn: "Links" },
                  { id: "notes", labelVi: "Ghi chú", labelEn: "Notes" },
                ].map((tab) => {
                  const isActive = category === tab.id;
                  const label = locale === "vi" ? tab.labelVi : tab.labelEn;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setCategory(tab.id as any);
                        setActiveIndex(0);
                      }}
                      className={`text-[10px] font-semibold px-3 py-1 rounded-full transition-all cursor-pointer border ${
                        isActive
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm"
                          : "bg-transparent border-transparent text-auth-text-3 hover:text-auth-text-2 hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Content pane */}
            <div className="bg-[#0c0c0e]/30">
              {query.trim() === "" ? (
                <div className="py-6 px-4 text-center text-xs text-auth-text-3 flex flex-col items-center gap-2 select-none">
                  <div className="h-8 w-8 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                    <Search className="h-4 w-4 text-auth-text-3/60" />
                  </div>
                  <p className="font-semibold text-auth-text-2/80">
                    {locale === "vi" ? "Tìm kiếm tri thức trong Wiki" : "Search knowledge in Wiki"}
                  </p>
                  <p className="text-[10.5px] leading-relaxed max-w-xs text-auth-text-3/70">
                    {locale === "vi"
                      ? "Nhập từ khóa để tìm nhanh các SRS, Use Case, API Specs hoặc mã nguồn đã lưu trữ."
                      : "Type keywords to search compiled SRS, Use Cases, API Specs, or manual notes."}
                  </p>
                </div>
              ) : filteredResults.length === 0 && !loading ? (
                <div className="py-8 px-4 text-center text-xs text-auth-text-3 select-none flex flex-col items-center gap-1.5">
                  <span className="text-lg">🔍</span>
                  <p className="font-semibold text-auth-text-2">
                    {locale === "vi" ? "Không có kết quả nào" : "No results found"}
                  </p>
                  <p className="text-[10px] text-auth-text-3/70">
                    {locale === "vi"
                      ? `Không tìm thấy tài liệu phù hợp trong danh mục này`
                      : `No matching items found in this category`}
                  </p>
                </div>
              ) : (
                <div
                  ref={resultsRef}
                  className="max-h-[300px] overflow-y-auto py-1 px-1.5"
                >
                  {filteredResults.map((item, idx) => {
                    const isSelected = activeIndex === idx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group select-none ${
                          isSelected
                            ? "bg-white/[0.05] border-white/[0.03] shadow-sm"
                            : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 mr-3">
                          {getSourceIcon(item.sourceType)}
                          <div className="flex flex-col min-w-0">
                            {/* Prevent text overflow beyond parent */}
                            <span className="text-[12.5px] font-semibold text-auth-text truncate leading-snug">
                              {item.title}
                            </span>
                            <span className="text-[10px] text-auth-text-3 truncate mt-0.5">
                              {item.domain?.name} {item.tags && item.tags.length > 0 ? `• ${item.tags[0]}` : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected ? (
                            <CornerDownLeft className="h-3 w-3 text-auth-accent animate-pulse" />
                          ) : (
                            <span className="text-[9px] font-mono text-auth-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              Open
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Command guide footer */}
            <div className="bg-[#0b0b0d] border-t border-white/[0.06] py-2 px-4 flex items-center justify-between text-[9.5px] font-mono text-auth-text-3 select-none">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="bg-white/5 border border-white/10 px-1 py-0.2 rounded text-[8px]">↑↓</span>
                  {locale === "vi" ? "Di chuyển" : "Navigate"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="bg-white/5 border border-white/10 px-1 py-0.2 rounded text-[8px]">↵ Enter</span>
                  {locale === "vi" ? "Mở tài liệu" : "Select"}
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1">
                  <span className="bg-white/5 border border-white/10 px-1.5 py-0.2 rounded text-[8px]">ESC</span>
                  {locale === "vi" ? "Thoát" : "Close"}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
