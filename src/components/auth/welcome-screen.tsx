"use client";

/**
 * WelcomeScreen — shown immediately after successful registration + login.
 *
 * Displayed at /[locale]/welcome before the user proceeds to /onboarding.
 * Protected route: user must be authenticated to view.
 *
 * Flow: Register → Verify Email (bypassed/manual) → Welcome → Onboarding
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { LineIcon } from "@/components/shared/line-icon";
import { PulseLogo } from "@/components/shared/pulse-logo";
import { Button } from "@/components/ui";
import { ProtectedRoute } from "@/components/auth/protected-route";

// ────────────────────────────────────────────────────────────────
// WelcomePageClient — ProtectedRoute wrapper (exported for page.tsx)
// ────────────────────────────────────────────────────────────────

export function WelcomePageClient() {
  return (
    <ProtectedRoute>
      <WelcomeScreen />
    </ProtectedRoute>
  );
}

// ────────────────────────────────────────────────────────────────
// WelcomeScreen — the actual welcome UI
// ────────────────────────────────────────────────────────────────

function WelcomeScreen() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [visible, setVisible] = useState(false);

  // Typewriter effect state
  const [typedText, setTypedText] = useState("");
  const fullTaglineText = t("onboarding.welcome.tagline");

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect
  useEffect(() => {
    setTypedText("");
    let index = 0;
    const interval = setInterval(() => {
      setTypedText(fullTaglineText.slice(0, index + 1));
      index++;
      if (index >= fullTaglineText.length) {
        clearInterval(interval);
      }
    }, 35); // 35ms per character
    return () => clearInterval(interval);
  }, [fullTaglineText]);

  const handleContinue = () => {
    setIsRedirecting(true);
    router.push(`/${locale}/onboarding`);
  };

  const firstName = user?.firstName || user?.displayName?.split(" ")[0] || "";

  const features = [
    {
      icon: "brain-alt",
      title: t("onboarding.welcome.feat1Title"),
      desc: t("onboarding.welcome.feat1Desc"),
      gradient: "from-violet-500/20 to-violet-500/5",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
    },
    {
      icon: "search",
      title: t("onboarding.welcome.feat2Title"),
      desc: t("onboarding.welcome.feat2Desc"),
      gradient: "from-[var(--color-brand-600)]/20 to-[var(--color-brand-600)]/5",
      iconColor: "text-[var(--color-brand-400)]",
      borderColor: "border-[var(--color-brand-500)]/20",
    },
    {
      icon: "target",
      title: t("onboarding.welcome.feat3Title"),
      desc: t("onboarding.welcome.feat3Desc"),
      gradient: "from-[var(--color-brand-600)]/20 to-[var(--color-brand-600)]/5",
      iconColor: "text-[var(--color-brand-400)]",
      borderColor: "border-[var(--color-brand-500)]/20",
    },
  ];

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-auth-bg px-4 py-12 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Background ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--color-brand-600)]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-auth-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-auth-border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Badge */}
        <div
          className={`mb-6 flex justify-center transition-all duration-500 delay-100 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-600)]/10 px-4 py-1.5">
            <LineIcon name="star" className="h-3.5 w-3.5 text-[var(--color-brand-400)]" />
            <span className="text-xs font-semibold text-[var(--color-brand-300)]">
              {t("onboarding.welcome.activationSuccess")}
            </span>
          </div>
        </div>

        {/* Main heading */}
        <div
          className={`mb-8 text-center transition-all duration-500 delay-150 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {/* Logo */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-auth-surface border border-white/[0.08] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <PulseLogo size={36} className="drop-shadow-[0_0_8px_var(--color-auth-accent-glow)]" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-auth-text sm:text-[2.25rem]">
            {firstName ? (
              <>
                {t("onboarding.welcome.welcomeUser")},{" "}
                <span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">
                  {firstName}
                </span>
                ! 🎉
              </>
            ) : (
              <>
                {t("onboarding.welcome.welcomeTo")}{" "}
                <span className="bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-accent-300)] bg-clip-text text-transparent">
                  Pulse Knowledge
                </span>
                ! 🎉
              </>
            )}
          </h1>

          <p className="mt-3 text-[15px] font-semibold text-brand-400 leading-relaxed min-h-[24px] flex items-center justify-center">
            <span>{typedText}</span>
            <span className="typewriter-cursor ml-0.5 text-brand-300 font-normal select-none">|</span>
          </p>
          <p className="mt-2 text-sm text-auth-text-3 leading-relaxed max-w-lg mx-auto">
            {t("onboarding.welcome.desc")}
          </p>
        </div>

        {/* Feature cards */}
        <div
          className={`mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 transition-all duration-500 delay-200 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {features.map((feature, i) => {
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-3 rounded-2xl border ${feature.borderColor} bg-gradient-to-b ${feature.gradient} p-5 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${feature.borderColor} bg-auth-elevated/80`}
                >
                  <LineIcon name={feature.icon} className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-auth-text uppercase tracking-wider">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-auth-text-3 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick stats row */}
        <div
          className={`mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 transition-all duration-500 delay-[250ms] ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {[
            { icon: "bolt", label: t("onboarding.welcome.statFeature1") },
            { icon: "book", label: t("onboarding.welcome.statFeature2") },
            { icon: "brain-alt", label: t("onboarding.welcome.statFeature3") },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <LineIcon name={Icon} className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-400)]" />
              <span className="text-[11px] text-auth-text-3">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-500 delay-300 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Button
            variant="primary"
            size="lg"
            isLoading={isRedirecting}
            onClick={handleContinue}
            rightIcon={!isRedirecting ? <LineIcon name="chevron-right" className="h-5 w-5" /> : undefined}
            className="min-w-[240px] text-[15px] font-bold"
          >
            {t("onboarding.welcome.btn")}
          </Button>
          <p className="text-[11px] text-auth-text-3">
            {t("onboarding.welcome.setupDuration")}
          </p>
        </div>
      </div>
    </div>
  );
}
