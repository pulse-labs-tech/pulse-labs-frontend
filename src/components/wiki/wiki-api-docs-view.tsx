"use client";

import { useState } from "react";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { AppHeader } from "@/components/layout";
import { useTranslation } from "@/contexts/locale-context";
import { apiDocsList } from "./api-docs-data";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";

interface WikiApiDocsViewProps {
  locale: string;
}

export function WikiApiDocsView({ locale }: WikiApiDocsViewProps) {
  const { t } = useTranslation();
  const [selectedApiDocId, setSelectedApiDocId] = useState<string>("auth");

  const activeDoc = apiDocsList.find((d) => d.id === selectedApiDocId) || apiDocsList[0];

  return (
    <div className="min-h-screen bg-auth-bg text-auth-text relative overflow-x-hidden flex flex-col">
      {/* Ambient Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 blur-[120px]"
        style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.1) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Main App Header */}
      <AppHeader active="wiki" locale={locale} />

      {/* Main Content Area */}
      <main className="container-focused flex-grow py-8 relative z-10 flex flex-col">
        {/* Back navigation */}
        <div>
          <Link
            href={`/${locale}/wiki`}
            className="inline-flex items-center gap-1.5 text-xs text-auth-text-3 hover:text-white transition-colors cursor-pointer group"
          >
            <LineIcon name="chevron-left" className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
            <span>{locale === "vi" ? "Quay lại Thư viện Wiki" : "Back to Wiki Library"}</span>
          </Link>
        </div>

        {/* Page Title Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap mt-5 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-auth-accent-dim text-auth-accent flex items-center justify-center shrink-0">
              <LineIcon name="code" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-fluid-xl font-extrabold tracking-tight">
                {locale === "vi" ? "Tài liệu API" : "Developer APIs"}
              </h1>
              <p className="text-xs text-auth-text-2 mt-0.5">
                {locale === "vi"
                  ? "Tài liệu tích hợp API dành cho lập trình viên"
                  : "System integration API documentation"}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start mt-6">
          {/* Left sidebar: modules list */}
          <div className="backdrop-blur-md bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-4 flex flex-col gap-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-auth-text-3 px-2 mb-2">
              {locale === "vi" ? "Danh sách API" : "API Modules"}
            </div>
            {apiDocsList.map((doc) => {
              const isSelected = selectedApiDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedApiDocId(doc.id)}
                  className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-auth-accent-dim text-auth-accent border border-auth-accent/20"
                      : "bg-auth-elevated border-auth-border text-auth-text-2 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <LineIcon
                    name={doc.id === "auth" ? "lock" : doc.id === "users" ? "user" : doc.id === "onboarding" ? "grid-alt" : "compass"}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="truncate">{doc.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right panel: Markdown documentation content */}
          <div className="backdrop-blur-md bg-auth-surface/30 border border-white/[0.06] rounded-2xl p-6 lg:p-8 flex flex-col min-w-0">
            {/* Document Metadata header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <LineIcon name="code" className="h-4 w-4 text-auth-accent" />
                <span className="text-xs font-semibold text-auth-text-3 font-mono">
                  {activeDoc.filename}
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.04] border border-white/[0.10] text-auth-text-2 uppercase tracking-wide">
                V1.0 — 2026
              </span>
            </div>

            {/* Render the Markdown content */}
            <div className="prose prose-invert max-w-none">
              <MarkdownRenderer content={activeDoc.content} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
