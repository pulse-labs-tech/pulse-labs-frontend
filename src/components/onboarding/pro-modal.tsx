"use client";

import { LineIcon } from "@/components/shared/line-icon";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";
import { useTranslation } from "@/contexts/locale-context";

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProModal({ isOpen, onClose }: ProModalProps) {
  const { t } = useTranslation();

  const handleUpgrade = () => {
    // Redirect to upgrade page (or mock payment activation path)
    window.location.href = "/settings/plan/upgrade";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl rounded-2xl shadow-2xl z-10 premium-hover-card-flow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-auth-text"
                  >
                    {t("onboarding.proModal.title")}
                  </h2>
                  <p className="text-sm text-auth-text-2 mt-1">
                    {t("onboarding.proModal.subtitle")}
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 text-auth-text-3 hover:text-auth-text"
                  aria-label="Close modal"
                >
                  <LineIcon name="xmark" className="h-4 w-4" />
                </Button>
              </div>

              {/* Plans Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Free Plan */}
                <div className="flex flex-col rounded-xl border border-auth-border bg-auth-elevated p-5">
                  <span className="text-xs font-semibold text-auth-text-3 uppercase tracking-wider">
                    {t("onboarding.proModal.currentPlan")}
                  </span>
                  <div className="text-lg font-bold text-auth-text-2 mt-1">
                    {t("onboarding.proModal.freePlan")}
                  </div>
                  <div className="text-2xl font-mono font-bold text-auth-text mt-2">
                    $0<span className="text-xs text-auth-text-3 font-sans font-normal">{t("onboarding.proModal.month")}</span>
                  </div>

                  <div className="flex flex-col gap-3 mt-6 flex-grow">
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.freeFeature1")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.freeFeature2")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.freeFeature3")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-3 line-through">
                      <LineIcon name="xmark" className="h-4 w-4 text-auth-error shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.freeFeature4")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-3 line-through">
                      <LineIcon name="xmark" className="h-4 w-4 text-auth-error shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.freeFeature5")}</span>
                    </div>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="flex flex-col rounded-xl border border-auth-accent bg-auth-accent-dim p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-auth-accent text-auth-text px-3 py-0.5 rounded-bl-lg text-[10px] font-bold">
                    {t("onboarding.proModal.recommended")}
                  </div>
                  <span className="text-xs font-semibold text-auth-accent uppercase tracking-wider">
                    {t("onboarding.proModal.recommendedSub")}
                  </span>
                  <div className="text-lg font-bold text-auth-text mt-1">
                    {t("onboarding.proModal.proPlan")}
                  </div>
                  <div className="text-2xl font-mono font-bold text-auth-text mt-2">
                    $19<span className="text-xs text-auth-text-3 font-sans font-normal">{t("onboarding.proModal.month")}</span>
                  </div>

                  <div className="flex flex-col gap-3 mt-6 flex-grow">
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.proFeature1")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.proFeature2")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.proFeature3")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.proFeature4")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>{t("onboarding.proModal.proFeature5")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2 bg-auth-orange-dim border border-auth-orange/20 rounded-lg p-3 text-xs text-auth-text-2 mb-6">
                <LineIcon name="warning" className="h-4 w-4 text-auth-orange shrink-0 mt-0.5" />
                <span>
                  <strong>{t("onboarding.proModal.notice")}</strong> {t("onboarding.proModal.noticeText")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleUpgrade}
                  variant="primary"
                  size="lg"
                  className="flex-1"
                >
                  {t("onboarding.proModal.upgradeBtn")}
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                >
                  {t("onboarding.proModal.continueBtn")}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
