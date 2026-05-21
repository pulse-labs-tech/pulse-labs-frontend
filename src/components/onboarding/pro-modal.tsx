"use client";

import { X, Check, Gem, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProModal({ isOpen, onClose }: ProModalProps) {
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
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-auth-border bg-auth-surface shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Top header pattern */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-auth-accent via-auth-purple to-auth-cyan" />

            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-auth-text flex items-center gap-2"
                  >
                    <Gem className="h-6 w-6 text-auth-accent animate-pulse" />
                    Nâng cấp lên Pro Plan
                  </h2>
                  <p className="text-sm text-auth-text-2 mt-1">
                    Mở khoá đa vai trò (Multi-role), tăng giới hạn lưu trữ và số lượng truy vấn AI.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 border border-auth-border bg-auth-elevated text-auth-text-3 hover:text-auth-text hover:bg-auth-card-hover transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Plans Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Free Plan */}
                <div className="flex flex-col rounded-xl border border-auth-border bg-auth-elevated p-5">
                  <span className="text-xs font-semibold text-auth-text-3 uppercase tracking-wider">
                    Gói hiện tại
                  </span>
                  <div className="text-lg font-bold text-auth-text-2 mt-1">🆓 Free Plan</div>
                  <div className="text-2xl font-mono font-bold text-auth-text mt-2">
                    $0<span className="text-xs text-auth-text-3 font-sans font-normal"> / tháng</span>
                  </div>

                  <div className="flex flex-col gap-3 mt-6 flex-grow">
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>1 Role KB (Không thể chuyển đổi)</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>50 queries AI / tháng</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-2">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>50 MB dung lượng seed KB</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-3 line-through">
                      <X className="h-4 w-4 text-auth-error shrink-0 mt-0.5" />
                      <span>Sử dụng đồng thời nhiều Role KB</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text-3 line-through">
                      <X className="h-4 w-4 text-auth-error shrink-0 mt-0.5" />
                      <span>Không gian làm việc chung (Team)</span>
                    </div>
                  </div>
                </div>

                {/* Pro Plan */}
                <div className="flex flex-col rounded-xl border border-auth-purple bg-auth-purple-dim p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-auth-purple text-auth-text px-3 py-0.5 rounded-bl-lg text-[10px] font-bold">
                    KHUYÊN DÙNG
                  </div>
                  <span className="text-xs font-semibold text-auth-purple uppercase tracking-wider">
                    Đề xuất nâng cấp
                  </span>
                  <div className="text-lg font-bold text-auth-text mt-1 flex items-center gap-1.5">
                    💎 Pro Plan
                  </div>
                  <div className="text-2xl font-mono font-bold text-auth-text mt-2">
                    $19<span className="text-xs text-auth-text-3 font-sans font-normal"> / tháng</span>
                  </div>

                  <div className="flex flex-col gap-3 mt-6 flex-grow">
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>Tối đa 5 Role KB trong Onboarding MVP</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>1,000 queries AI / tháng</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>500 MB dung lượng seed KB</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>Sử dụng đồng thời nhiều Role KB</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-auth-text">
                      <Check className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                      <span>Không gian làm việc chung (Team)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="flex items-start gap-2 bg-auth-orange-dim border border-auth-orange/20 rounded-lg p-3 text-xs text-auth-text-2 mb-6">
                <ShieldAlert className="h-4 w-4 text-auth-orange shrink-0 mt-0.5" />
                <span>
                  <strong>Lưu ý:</strong> Gói Pro sẽ hỗ trợ cấu hình tới 5 vị trí công việc (Role KB) cùng một lúc ngay trong bước thiết lập ban đầu này.
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-3 px-4 bg-auth-accent hover:bg-auth-accent-dark text-black font-semibold rounded-lg text-sm text-center shadow-lg shadow-auth-accent-glow transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Nâng cấp Pro ngay →
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border border-auth-border bg-auth-elevated text-auth-text-2 hover:text-auth-text hover:bg-auth-card-hover rounded-lg text-sm text-center transition-colors"
                >
                  Tiếp tục dùng bản Free
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
