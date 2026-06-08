"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getLocalizedPath } from "@/lib/utils";
import { LineIcon } from "@/components/shared/line-icon";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";
import { ProModal } from "./pro-modal";
import { useTranslation } from "@/contexts/locale-context";
import {
  getOnboardingStateAction,
  getRoleOptionsAction,
  saveRolesAction,
  submitSeedAction,
  getCompileJobAction,
  completeOnboardingAction,
} from "@/lib/client-api";
import type {
  RoleGroup,
  RoleGroupOption,
  RoleOption,
  SaveRoleInput,
  SeedRequest,
  CompileJobDto,
  OnboardingStep,
  Plan,
} from "@/types/onboarding";

// ────────────────────────────────────────────────────────────────
// Static Fallbacks for Roles (matching prototype)
// ────────────────────────────────────────────────────────────────
const STATIC_ROLE_GROUPS: RoleGroupOption[] = [
  {
    id: "engineering",
    label: "Engineering",
    icon: "settings",
    roles: [
      { id: "frontend", label: "Frontend Dev", description: "React, Vue, CSS, UI, Performance" },
      { id: "backend", label: "Backend Dev", description: "API, DB, Architecture, Security" },
      { id: "mobile", label: "Mobile Dev", description: "iOS, Android, Flutter, RN" },
      { id: "devops", label: "DevOps / Platform", description: "CI/CD, K8s, Cloud, SRE" },
      { id: "security", label: "Security Eng", description: "AppSec, Infra, Compliance" },
      { id: "qa", label: "QA / Testing", description: "Automation, Test strategy" },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: "briefcase",
    roles: [
      { id: "ba", label: "Business Analyst", description: "Requirements, BPMN, User Stories" },
      { id: "pm", label: "Product Manager", description: "Roadmap, OKR, Go-to-market" },
      { id: "marketing", label: "Marketing", description: "Growth, Content, Campaign" },
      { id: "sales", label: "Sales", description: "Pipeline, Objection, CRM" },
      { id: "finance", label: "Finance / Accounting", description: "Budgeting, Reporting, Audit" },
      { id: "operations", label: "Operations", description: "Process, Supply chain, Logistics" },
    ],
  },
  {
    id: "design",
    label: "Design & Product",
    icon: "palette",
    roles: [
      { id: "ux", label: "UX Designer", description: "Research, Wireframe, Usability" },
      { id: "ui", label: "UI Designer", description: "Design system, Figma, Visual" },
      { id: "prod_design", label: "Product Designer", description: "End-to-end product design" },
    ],
  },
  {
    id: "data",
    label: "Data & AI",
    icon: "bar-chart",
    roles: [
      { id: "data_analyst", label: "Data Analyst", description: "SQL, BI, Dashboard, Insight" },
      { id: "data_eng", label: "Data Engineer", description: "Pipeline, ETL, Warehouse" },
      { id: "ai_ml", label: "AI / ML Engineer", description: "LLM, RAG, Training, MLOps" },
    ],
  },
  {
    id: "other",
    label: "Khác",
    icon: "plus",
    roles: [],
  },
];

// Helper to generate a session-unique idempotency key
function generateIdempotencyKey() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { t, locale } = useTranslation();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");

  // Onboarding metadata/limits
  const [roleLimit, setRoleLimit] = useState(1);

  // Role selection state
  const [roleGroups, setRoleGroups] = useState<RoleGroupOption[]>(STATIC_ROLE_GROUPS);
  const [activeGroup, setActiveGroup] = useState<RoleGroup>("engineering");
  const [selectedRoles, setSelectedRoles] = useState<{
    id: string;
    label: string;
    group: RoleGroup;
    isCustom: boolean;
  }[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState("");

  // Seed state
  const [seedType, setSeedType] = useState<"text" | "url">("url");
  const [seedText, setSeedText] = useState("");
  const [seedUrl, setSeedUrl] = useState("");

  // Async compile polling state
  const [compileJob, setCompileJob] = useState<CompileJobDto | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [pollTimeoutReached, setPollTimeoutReached] = useState(false);

  // Modals & nudges
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [showProNudge, setShowProNudge] = useState(false);

  // Vietnamese error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);

  // Typewriter effect for welcome tagline
  const fullTagline = t("onboarding.welcome.tagline");
  const [typedTagline, setTypedTagline] = useState("");
  const [taglineDone, setTaglineDone] = useState(false);

  // Idempotency keys (kept for potential future use)
  const roleIdempotencyRef = useRef(generateIdempotencyKey());
  const seedIdempotencyRef = useRef(generateIdempotencyKey());
  const completeIdempotencyRef = useRef(generateIdempotencyKey());

  // Store the primary roleKbId from saveRoles response for use in seed step
  const primaryRoleKbIdRef = useRef<string>("");

  // Ref for timer
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect — runs only on the welcome step
  useEffect(() => {
    if (currentStep !== "welcome") return;
    setTypedTagline("");
    setTaglineDone(false);
    let i = 0;
    const iv = setInterval(() => {
      setTypedTagline(fullTagline.slice(0, i + 1));
      i++;
      if (i >= fullTagline.length) {
        clearInterval(iv);
        setTaglineDone(true);
      }
    }, 30);
    return () => clearInterval(iv);
  }, [currentStep, fullTagline]);

  // ────────────────────────────────────────────────────────────────
  // Error Mapping Handler (Vietnamese Copy Mapping)
  // ────────────────────────────────────────────────────────────────
  const handleErrorCode = useCallback((code: string, fallbackMsg: string) => {
    if (code === "UNAUTHORIZED") {
      router.push(`/${locale}/login?returnUrl=/onboarding`);
    }
    const msgKey = `onboarding.errors.${code}`;
    const translated = t(msgKey, fallbackMsg || t("onboarding.errors.setupError"));
    setErrorMsg(translated);
    if (code === "RATE_LIMITED") {
      setRateLimitCooldown(60); // default cooldown window
    }
  }, [router, locale, t]);

  // ────────────────────────────────────────────────────────────────
  // 1. Initial State Sync (State Bootstrap & Resume)
  // ────────────────────────────────────────────────────────────────
  const bootstrapCalledRef = useRef(false);

  useEffect(() => {
    // Guard: prevent double execution in React StrictMode
    if (bootstrapCalledRef.current) return;
    bootstrapCalledRef.current = true;

    let cancelled = false;

    async function bootstrap() {
      try {
        const [stateRes, optionsRes] = await Promise.all([
          getOnboardingStateAction(),
          getRoleOptionsAction(),
        ]);

        console.log("🟢 [F12 API RESPONSE] getOnboardingStateAction:", stateRes);
        console.log("🟢 [F12 API RESPONSE] getRoleOptionsAction:", optionsRes);

        if (cancelled) return;

        if (stateRes.status === "1" && stateRes.data) {
          const {
            currentStep: step,
            plan: userPlan,
            limits,
            roles,
            seed,
          } = stateRes.data;

          setPlan(userPlan);
          setRoleLimit(limits?.roleLimit ?? 1);

          // Restore step state (FR-ONB-011 Resume rules)
          if (step === "done") {
            // Onboarding already completed — redirect to dashboard
            if (user) {
              setUser({ ...user, onboardingStatus: "completed" });
            }
            router.replace("/dashboard");
            return; // Don't set isInitializing to false — keep loading screen
          } else if (step === "welcome") {
            setCurrentStep("welcome");
          } else {
            setCurrentStep(step);
          }

          // Restore previously saved roles
          if (roles && roles.length > 0) {
            setSelectedRoles(
              roles.map((r) => ({
                id: r.roleOptionId || r.id,
                label: r.roleName,
                group: r.roleGroup,
                isCustom: r.isCustom,
              })),
            );
            // Restore primary roleKbId for seed step
            const primaryRole = roles.find((r) => r.isPrimary) ?? roles[0];
            if (primaryRole) primaryRoleKbIdRef.current = primaryRole.id;
          }

          // Restore seed / compile job state
          if (seed) {
            if (seed.compileJob) {
              setCompileJob(seed.compileJob);
              setCurrentStep("seed_kb");
            }
          }
        } else {
          // Handle bootstrap error
          handleErrorCode(stateRes.error_code, stateRes.msg);
        }

        // Setup role options (dynamic catalogue)
        // API returns `group` field (not `id`) at group level — normalize to RoleGroupOption shape
        if (optionsRes.status === "1" && optionsRes.data?.groups) {
          const normalized: RoleGroupOption[] = optionsRes.data.groups.map((g) => {
            // API uses `group` field instead of `id` for the group identifier
            const groupId = (g.id || g.group || "") as RoleGroup;
            const normalizedRoles: RoleOption[] = (g.roles ?? []).map((r) => ({
              id: r.id || r.roleOptionId || "",
              label: r.label || "",
              description: r.description || r.desc || "",
            }));
            return {
              id: groupId,
              group: groupId,
              label: g.label || groupId,
              icon: g.icon || "",
              roles: normalizedRoles,
            };
          });
          setRoleGroups(normalized);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Bootstrap error:", err);
        setErrorMsg(t("auth.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."));
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────────────────────
  // 2. Cooldown timer for Rate Limiting
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (rateLimitCooldown !== null && rateLimitCooldown > 0) {
      rateLimitTimerRef.current = setTimeout(() => {
        setRateLimitCooldown((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => {
      if (rateLimitTimerRef.current) clearTimeout(rateLimitTimerRef.current);
    };
  }, [rateLimitCooldown]);

  // ────────────────────────────────────────────────────────────────
  // 3. Compile Polling Logic (FR-ONB-012 & Polling Policy)
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!compileJob) return;

    const isTerminal =
      compileJob.status === "wiki_ready" ||
      compileJob.status === "failed" ||
      compileJob.status === "cancelled";

    if (isTerminal) {
      if (compileJob.status === "failed") {
        setTimeout(() => {
          setCompileError(
            t("onboarding.seed.compileError", "Chưa compile được nguồn này. Bạn có thể thử lại hoặc thêm nguồn khác sau."),
          );
        }, 0);
      }
      return;
    }

    // Set polling intervals: 2s for first 30s, 5s afterwards
    const startedTime = new Date(compileJob.createdAt).getTime();
    const elapsedSeconds = (Date.now() - startedTime) / 1000;

    let pollInterval = 2000;
    if (elapsedSeconds > 30) {
      pollInterval = 5000;
    }

    // 5 minutes timeout limit
    if (elapsedSeconds > 300) {
      setTimeout(() => {
        setPollTimeoutReached(true);
      }, 0);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        const res = await getCompileJobAction(compileJob.id);
        console.log("🟢 [F12 API RESPONSE] getCompileJobAction (onboarding):", res);
        if (!cancelled && res.status === "1" && res.data?.compileJob) {
          setCompileJob(res.data.compileJob);
        }
      } catch (err) {
        console.error("Polling job error:", err);
      }
    }, pollInterval);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [compileJob]);

  // ────────────────────────────────────────────────────────────────
  // UI Handlers
  // ────────────────────────────────────────────────────────────────
  const handlePickDomain = (group: RoleGroup) => {
    setActiveGroup(group);
    setErrorMsg(null);

    // Free tier reset if switching domains
    if (plan === "free" && selectedRoles.length > 0) {
      // Prompt warning on 2nd role selection attempt
      setShowProNudge(true);
    }
  };

  const handlePickRole = (roleOptionId: string, label: string) => {
    setErrorMsg(null);

    const isAlreadySelected = selectedRoles.some((r) => r.id === roleOptionId);

    if (isAlreadySelected) {
      // Toggle off
      setSelectedRoles(selectedRoles.filter((r) => r.id !== roleOptionId));
      return;
    }

    // Checking Limits
    if (plan === "free") {
      if (selectedRoles.length >= 1) {
        setShowProNudge(true);
        setIsProModalOpen(true);
        return;
      }
      setSelectedRoles([{ id: roleOptionId, label, group: activeGroup, isCustom: false }]);
    } else {
      // Pro Limit up to 5 roles
      if (selectedRoles.length >= 5) {
        setErrorMsg(t("onboarding.pickRole.customLimit", "Pro plan hỗ trợ tối đa 5 Role KB trong giai đoạn thiết lập ban đầu."));
        return;
      }
      setSelectedRoles([
        ...selectedRoles,
        { id: roleOptionId, label, group: activeGroup, isCustom: false },
      ]);
    }
  };

  const handleCustomRoleSubmit = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;

    if (trimmed.length < 2 || trimmed.length > 80) {
      setErrorMsg(t("onboarding.pickRole.customLengthError", "Role cần ít nhất từ 2 đến 80 ký tự."));
      return;
    }

    setErrorMsg(null);

    if (plan === "free") {
      setSelectedRoles([
        { id: `custom_${Date.now()}`, label: trimmed, group: "other", isCustom: true },
      ]);
      setCustomRoleInput("");
    } else {
      if (selectedRoles.length >= 5) {
        setErrorMsg(t("onboarding.pickRole.customLimit", "Pro plan hỗ trợ tối đa 5 Role KB trong giai đoạn thiết lập ban đầu."));
        return;
      }
      setSelectedRoles([
        ...selectedRoles,
        { id: `custom_${Date.now()}`, label: trimmed, group: "other", isCustom: true },
      ]);
      setCustomRoleInput("");
    }
  };

  const handleRemoveRole = (id: string) => {
    setSelectedRoles(selectedRoles.filter((r) => r.id !== id));
  };

  // Step 2 Submission (Save Roles)
  const handleSaveRoles = async () => {
    if (selectedRoles.length === 0) {
      setErrorMsg(t("onboarding.errors.ROLE_REQUIRED", "Chọn một role để Pulse tạo Knowledge Base đầu tiên cho bạn."));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Map roles payload — API expects roleOptionId (not roleId), roleName, roleGroup, isPrimary, isCustom
      const rolesInput: SaveRoleInput[] = selectedRoles.map((r, index) => ({
        roleOptionId: r.isCustom ? null : r.id,
        roleName: r.label,
        roleGroup: r.group,
        isCustom: r.isCustom,
        isPrimary: index === 0,
      }));

      const res = await saveRolesAction(rolesInput);
      console.log("🟢 [F12 API RESPONSE] saveRolesAction:", res);

      if (res.status === "1") {
        // After save, we need to fetch the state again to get roleKbId
        // (API returns {} on success, roleKbId is in the state response)
        // Fetch updated state to get the roleKbId created by the server
        try {
          const stateRes = await getOnboardingStateAction();
          console.log("🟢 [F12 API RESPONSE] getOnboardingStateAction (after saveRoles):", stateRes);
          if (stateRes.status === "1" && stateRes.data?.roles?.length > 0) {
            const primaryRole = stateRes.data.roles.find((r) => r.isPrimary) ?? stateRes.data.roles[0];
            if (primaryRole) primaryRoleKbIdRef.current = primaryRole.id;
          }
        } catch {
          // Non-fatal — seed step will handle if roleKbId is missing
        }
        setCurrentStep("seed_kb");
        roleIdempotencyRef.current = generateIdempotencyKey();
      } else {
        handleErrorCode(res.error_code, res.msg);
      }
    } catch (err) {
      console.error("Save roles action error:", err);
      setErrorMsg(t("auth.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Ingestion Submit (Submit Seed)
  const handleSeedIngest = async () => {
    setErrorMsg(null);
    setCompileError(null);

    if (seedType === "text") {
      const trimmed = seedText.trim();
      if (trimmed.length < 50) {
        setErrorMsg(t("onboarding.seed.limitTextMin", "Nội dung cần ít nhất 50 ký tự để phân tích."));
        return;
      }
      if (trimmed.length > 50000) {
        setErrorMsg(t("onboarding.seed.limitTextMax", "Nội dung vượt quá giới hạn 50,000 ký tự."));
        return;
      }
    } else {
      const trimmedUrl = seedUrl.trim();
      if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        setErrorMsg(t("onboarding.seed.limitUrl", "Link không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://."));
        return;
      }
    }

    // roleKbId is required — must have been set after saveRoles
    if (!primaryRoleKbIdRef.current) {
      // Fetch state to try recover roleKbId
      try {
        const stateRes = await getOnboardingStateAction();
        console.log("🟢 [F12 API RESPONSE] getOnboardingStateAction (recover roleKbId):", stateRes);
        if (stateRes.status === "1" && stateRes.data?.roles?.length > 0) {
          const primaryRole = stateRes.data.roles.find((r) => r.isPrimary) ?? stateRes.data.roles[0];
          if (primaryRole) primaryRoleKbIdRef.current = primaryRole.id;
        }
      } catch {
        // continue and let API error surface
      }
    }

    setIsSubmitting(true);

    try {
      // API expects: { roleKbId, sourceType, content } — `content` holds both URL and text
      const payload: SeedRequest = {
        roleKbId: primaryRoleKbIdRef.current,
        sourceType: seedType,
        content: seedType === "text" ? seedText.trim() : seedUrl.trim(),
      };

      const res = await submitSeedAction(payload);
      console.log("🟢 [F12 API RESPONSE] submitSeedAction:", res);

      if (res.status === "1") {
        // API returns 202 — seed job started in background
        // Immediately call complete (per API contract)
        seedIdempotencyRef.current = generateIdempotencyKey();
        await handleOnboardingComplete(false);
      } else {
        handleErrorCode(res.error_code, res.msg);
      }
    } catch (err) {
      console.error("Submit seed action error:", err);
      setErrorMsg(t("auth.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 Completion (Skip or Done)
  const handleOnboardingComplete = async (skip: boolean) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await completeOnboardingAction({
        seedSkipped: skip,
        compileJobId: compileJob?.id || null,
        idempotencyKey: completeIdempotencyRef.current,
      });
      console.log("🟢 [F12 API RESPONSE] completeOnboardingAction:", res);

      if (res.status === "1") {
        // Hydrate context user state
        if (user) {
          setUser({ ...user, onboardingStatus: "completed" });
        }
        // API returns { nextRoute: "/dashboard" }
        const nextRoute = res.data?.nextRoute || "/dashboard";
        router.push(getLocalizedPath(nextRoute, locale));
      } else {
        // 409 ONBOARDING_ALREADY_COMPLETED is non-fatal — treat as success
        if (res.error_code === "ONBOARDING_ALREADY_COMPLETED") {
          if (user) setUser({ ...user, onboardingStatus: "completed" });
          router.push(`/${locale}/dashboard`);
          return;
        }
        handleErrorCode(res.error_code, res.msg);
      }
    } catch (err) {
      console.error("Complete onboarding error:", err);
      setErrorMsg(t("auth.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stage labels for compilation
  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "queued":
        return t("dashboard.stage.queued", "Đang xếp hàng (Queued)");
      case "validating":
        return t("dashboard.stage.validating", "Xác thực nguồn dữ liệu...");
      case "fetching_or_uploading":
      case "fetching":
        return t("dashboard.stage.fetching", "Đang tải nguồn (Uploading)");
      case "extracting":
        return t("dashboard.stage.extracting", "Đang trích xuất văn bản (Parsing)");
      case "normalizing":
        return t("dashboard.stage.normalizing", "Đang chuẩn hoá văn bản...");
      case "chunking":
        return t("dashboard.stage.chunking", "Chia nhỏ tài liệu (Scanning source)");
      case "summarizing":
        return t("dashboard.stage.summarizing", "Tạo bản tóm tắt...");
      case "indexing":
        return t("dashboard.stage.indexing", "Đang biên dịch kiến thức (Compiling to Wiki)");
      case "wiki_ready":
      case "wikiReady":
        return t("dashboard.stage.wikiReady", "Biên dịch thành công (Wiki item ready)");
      case "failed":
        return t("dashboard.stage.failed", "Biên dịch thất bại — Thử lại");
      case "cancelled":
        return t("dashboard.stage.cancelled", "Đã hủy bỏ");
      default:
        return t("dashboard.stage.compiling", "Đang xử lý...");
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-auth-bg text-auth-text">
        <div className="flex flex-col items-center gap-4">
          <DotMatrixLoader variant="orbit" size="lg" />
          <p className="text-sm text-auth-text-2">{t("onboarding.seed.progressLoading", "Đang tải trạng thái thiết lập...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-auth-bg text-auth-text py-4 sm:py-8 md:py-12 px-4 relative overflow-hidden animate-fade-in">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-auth-accent/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-auth-accent-glow/5 rounded-full blur-[120px]" />

      <main className="flex-grow flex items-start sm:items-center justify-center z-10 w-full">
        <div className="w-full max-w-2xl rounded-2xl p-4 sm:p-6 md:p-10 shadow-auth shadow-black/40 flex flex-col gap-6 md:gap-8 relative backdrop-blur-md premium-hover-card">

          {/* ────────────────── Progress bar (Top) ────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center w-full">
              {/* Welcome step bubble */}
              <div className="flex items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    currentStep !== "welcome"
                      ? "bg-auth-accent border-auth-accent text-black"
                      : "border-auth-accent text-auth-accent bg-auth-accent-dim shadow-auth shadow-auth-accent-glow"
                  }`}
                >
                  {currentStep !== "welcome" ? <LineIcon name="checkmark" className="h-3 w-3 stroke-[3]" /> : 1}
                </div>
                <div
                  className={`flex-grow h-[2px] mx-2 ${
                    currentStep !== "welcome" ? "bg-auth-accent" : "bg-auth-border"
                  }`}
                />
              </div>

              {/* Pick Role step bubble */}
              <div className="flex items-center flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    currentStep === "seed_kb"
                      ? "bg-auth-accent border-auth-accent text-black"
                      : currentStep === "pick_role"
                        ? "border-auth-accent text-auth-accent bg-auth-accent-dim shadow-auth shadow-auth-accent-glow"
                        : "border-auth-border text-auth-text-3 bg-auth-elevated"
                  }`}
                >
                  {currentStep === "seed_kb" ? <LineIcon name="checkmark" className="h-3 w-3 stroke-[3]" /> : 2}
                </div>
                <div
                  className={`flex-grow h-[2px] mx-2 ${
                    currentStep === "seed_kb" ? "bg-auth-accent" : "bg-auth-border"
                  }`}
                />
              </div>

              {/* Seed KB step bubble */}
              <div className="flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    currentStep === "seed_kb"
                      ? "border-auth-accent text-auth-accent bg-auth-accent-dim shadow-auth shadow-auth-accent-glow"
                      : "border-auth-border text-auth-text-3 bg-auth-elevated"
                  }`}
                >
                  3
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="grid grid-cols-3 text-[11px] text-auth-text-3 font-semibold uppercase tracking-wider mt-1">
              <span className={`text-left ${currentStep === "welcome" ? "text-auth-accent" : "text-auth-accent"}`}>
                {t("onboarding.welcome.stepName", "Welcome")}
              </span>
              <span className={`text-center ${currentStep === "pick_role" ? "text-auth-accent" : ""}`}>
                {t("onboarding.pickRole.stepName", "Chọn Vai Trò")}
              </span>
              <span className={`text-right ${currentStep === "seed_kb" ? "text-auth-accent" : ""}`}>
                {t("onboarding.seed.stepName", "Nạp Kiến Thức")}
              </span>
            </div>
          </div>

          {/* ────────────────── Error Alert Region ────────────────── */}
          {errorMsg && (
            <div className="bg-auth-error-dim border border-auth-error/30 text-auth-error rounded-xl p-4 text-sm flex items-start gap-3 animate-fade-in">
              <LineIcon name="xmark"
                className="h-5 w-5 shrink-0 cursor-pointer hover:opacity-80"
                onClick={() => setErrorMsg(null)}
              />
              <div className="flex-grow">
                <p className="font-semibold">{t("onboarding.errors.setupError", "Lỗi thiết lập")}</p>
                <p className="text-auth-text-2 mt-0.5 text-xs">{errorMsg}</p>
                {rateLimitCooldown !== null && (
                  <p className="text-xs text-auth-text-3 mt-1.5 font-mono">
                    {t("auth.errors.RATE_LIMITED_RETRY", "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau {seconds} giây.").replace("{seconds}", String(rateLimitCooldown))}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ────────────────── STEP 1: Welcome ────────────────── */}
          {currentStep === "welcome" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-auth-text">
                  {t("onboarding.welcome.title")}
                </h1>
                <p className="text-sm text-auth-text-2 mt-3 leading-relaxed">
                  <strong className="text-auth-accent font-semibold">
                    {typedTagline}
                    {!taglineDone && <span className="typewriter-cursor ml-0.5 text-auth-accent/70 font-normal select-none">|</span>}
                  </strong>
                  {taglineDone && (
                    <>
                      <br />
                      {t("onboarding.welcome.desc")}
                    </>
                  )}
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-auth-elevated border border-auth-border rounded-xl p-4 flex flex-col gap-3 items-center text-center hover:border-white/[0.15] transition-colors hover-lift">
                  <div className="w-9 h-9 rounded-lg border border-auth-border bg-transparent text-auth-accent flex items-center justify-center">
                    <LineIcon name="brain-alt" className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-auth-text uppercase tracking-wider">
                    {t("onboarding.welcome.feat1Title")}
                  </h3>
                  <p className="text-xs text-auth-text-2 leading-relaxed">
                    {t("onboarding.welcome.feat1Desc")}
                  </p>
                </div>

                <div className="bg-auth-elevated border border-auth-border rounded-xl p-4 flex flex-col gap-3 items-center text-center hover:border-white/[0.15] transition-colors hover-lift">
                  <div className="w-9 h-9 rounded-lg border border-auth-border bg-transparent text-auth-accent flex items-center justify-center">
                    <LineIcon name="search" className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-auth-text uppercase tracking-wider">
                    {t("onboarding.welcome.feat2Title")}
                  </h3>
                  <p className="text-xs text-auth-text-2 leading-relaxed">
                    {t("onboarding.welcome.feat2Desc")}
                  </p>
                </div>

                <div className="bg-auth-elevated border border-auth-border rounded-xl p-4 flex flex-col gap-3 items-center text-center hover:border-white/[0.15] transition-colors hover-lift">
                  <div className="w-9 h-9 rounded-lg border border-auth-border bg-transparent text-auth-accent flex items-center justify-center">
                    <LineIcon name="target" className="h-5 w-5" />
                  </div>
                  <h3 className="text-xs font-bold text-auth-text uppercase tracking-wider">
                    {t("onboarding.welcome.feat3Title")}
                  </h3>
                  <p className="text-xs text-auth-text-2 leading-relaxed">
                    {t("onboarding.welcome.feat3Desc")}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-center border-t border-auth-border-subtle pt-4 sm:pt-6">
                <span className="text-xs text-auth-text-3 font-semibold">{t("onboarding.step1Of3")}</span>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentStep("pick_role")}
                  rightIcon={<LineIcon name="chevron-right" className="h-4 w-4" />}
                >
                  {t("onboarding.welcome.btn")}
                </Button>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 2: Pick Role ────────────────── */}
          {currentStep === "pick_role" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-auth-text">
                  {t("onboarding.pickRole.title")}
                </h1>
                <p className="text-xs text-auth-text-2 mt-2 leading-relaxed">
                  {t("onboarding.pickRole.subtitle")}
                  <br />
                  <span className="text-auth-accent font-medium mt-1 inline-block">
                    {plan === "free"
                      ? t("onboarding.pickRole.freeLimit")
                      : t("onboarding.pickRole.proLimit")}
                  </span>
                </p>
              </div>

              {/* Selected Roles Tokens */}
              {selectedRoles.length > 0 && (
                <div className="flex flex-col gap-2 bg-auth-elevated/40 border border-auth-border rounded-xl p-3">
                  <div className="text-[10px] font-bold text-auth-text-3 uppercase tracking-wider">
                    {t("onboarding.pickRole.selectedRoles")} ({selectedRoles.length}/{roleLimit})
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRoles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center gap-1.5 py-1 pl-2.5 pr-1.5 rounded-lg text-xs font-semibold bg-auth-accent-dim border border-auth-accent text-auth-accent"
                      >
                        {t("onboarding.groups." + role.group + ".roles." + role.id + ".label", role.label)}
                        <button
                          onClick={() => handleRemoveRole(role.id)}
                          className="hover:bg-auth-accent-dark/20 rounded p-0.5"
                        >
                          <LineIcon name="xmark" className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain Chips */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-auth-text-3 uppercase tracking-wider">
                  {t("onboarding.pickRole.selectGroup")}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {roleGroups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => handlePickDomain(group.id)}
                      className={`py-2 px-4 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        activeGroup === group.id
                          ? "bg-auth-accent-dim border-auth-accent text-auth-accent"
                          : "bg-auth-elevated border-auth-border text-auth-text-2 hover:border-white/[0.15] hover:text-auth-text"
                      }`}
                    >
                      {t("onboarding.groups." + group.id + ".label", group.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles Cards Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-auth-text-3 uppercase tracking-wider">
                  {t("onboarding.pickRole.selectRole")}
                </span>

                {activeGroup !== "other" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {roleGroups
                      .find((g) => g.id === activeGroup)
                      ?.roles.map((role) => {
                        const isSelected = selectedRoles.some((r) => r.id === role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => handlePickRole(role.id, role.label)}
                            className={`flex flex-col items-center text-center gap-1 p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                              isSelected
                                ? "bg-auth-accent-dim border-auth-accent"
                                : "bg-auth-elevated border-auth-border hover:border-white/[0.15]"
                            }`}
                          >
                            {isSelected && (
                              <span className="absolute top-2 right-2">
                                <LineIcon name="checkmark" className="h-3 w-3 text-auth-accent" />
                              </span>
                            )}
                            <span className="text-xs font-bold text-auth-text leading-snug">
                              {t("onboarding.groups." + activeGroup + ".roles." + role.id + ".label", role.label)}
                            </span>
                            <span className="text-[10px] text-auth-text-3 leading-normal mt-0.5">
                              {t("onboarding.groups." + activeGroup + ".roles." + role.id + ".desc", role.description)}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <div className="bg-auth-elevated border border-auth-border rounded-xl p-4 flex flex-col gap-3">
                    <label
                      htmlFor="custom-role"
                      className="text-xs font-bold text-auth-text-2 uppercase tracking-wide"
                    >
                      {t("onboarding.pickRole.customLabel")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="custom-role"
                        type="text"
                        value={customRoleInput}
                        onChange={(e) => setCustomRoleInput(e.target.value)}
                        placeholder={t("onboarding.pickRole.customPlaceholder")}
                        className="flex-grow bg-auth-surface border border-auth-border rounded-lg px-4 py-2 text-xs text-auth-text placeholder:text-auth-text-3 focus:border-auth-accent"
                        maxLength={80}
                      />
                      <Button
                        onClick={handleCustomRoleSubmit}
                        variant="secondary"
                        size="md"
                      >
                        {t("common.add")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pro Upgrade Nudge (Free plan role limit check nudges) */}
              {showProNudge && plan === "free" && (
                <div className="flex justify-between items-center bg-auth-elevated border border-auth-accent/30 rounded-xl p-3.5 text-xs text-auth-text-2 animate-fade-up">
                  <div className="flex items-center gap-2">
                    <LineIcon name="crown" className="h-4.5 w-4.5 text-auth-accent animate-pulse" />
                    <span>
                      {t("onboarding.pickRole.proNudgePrefix")}
                      <strong>{t("onboarding.pickRole.proNudgeHighlight")}</strong>
                      {t("onboarding.pickRole.proNudgeSuffix")}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsProModalOpen(true);
                    }}
                    className="text-auth-accent font-semibold hover:underline shrink-0"
                  >
                    {t("onboarding.pickRole.viewPro")}
                  </button>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-wrap justify-between items-center gap-3 border-t border-auth-border-subtle pt-4 sm:pt-6">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setCurrentStep("welcome")}
                  leftIcon={<LineIcon name="arrow-left" className="h-3.5 w-3.5" />}
                >
                  {t("common.back")}
                </Button>
                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-xs text-auth-text-3 font-semibold">{t("onboarding.step2Of3")}</span>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSaveRoles}
                    isLoading={isSubmitting}
                    disabled={selectedRoles.length === 0 || isSubmitting || rateLimitCooldown !== null}
                    rightIcon={!isSubmitting ? <LineIcon name="chevron-right" className="h-4 w-4" /> : undefined}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 3: Seed KB ────────────────── */}
          {currentStep === "seed_kb" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-auth-text">
                  {t("onboarding.seed.title")}
                </h1>
                <p className="text-xs text-auth-text-2 mt-2 leading-relaxed">
                  {t("onboarding.seed.subtitle")}
                  <br />
                  <span className="text-auth-text-3 font-medium">
                    {t("onboarding.seed.optional")}
                  </span>
                </p>
              </div>

              {/* Compile Ingestion State (FR-ONB-012 Compile progress) */}
              {compileJob ? (
                <div className="bg-auth-elevated border border-auth-border rounded-xl p-5 flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-auth-text uppercase tracking-wider">
                      {t("onboarding.seed.progressTitle")}
                    </span>
                    <span className="text-xs font-mono font-bold text-auth-accent">
                      {compileJob.progress}%
                    </span>
                  </div>

                  {/* Progress bar track */}
                  <div className="w-full h-2 bg-auth-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-auth-accent transition-all duration-300"
                      style={{ width: `${compileJob.progress}%` }}
                    />
                  </div>

                  {/* Message and stage indicator */}
                  <div className="flex items-start gap-3">
                    {compileJob.status !== "wiki_ready" &&
                    compileJob.status !== "failed" &&
                    compileJob.status !== "cancelled" ? (
                      <DotMatrixLoader variant="pulse" size="sm" />
                    ) : compileJob.status === "wiki_ready" ? (
                      <LineIcon name="checkmark" className="h-4 w-4 text-auth-accent shrink-0 mt-0.5" />
                    ) : (
                      <LineIcon name="xmark" className="h-4 w-4 text-auth-error shrink-0 mt-0.5" />
                    )}
                    <div className="flex-grow">
                      <p className="text-xs font-semibold text-auth-text">
                        {getStageLabel(compileJob.stage)}
                      </p>
                      <p className="text-[10px] text-auth-text-2 mt-0.5 leading-relaxed">
                        {compileJob.message}
                      </p>
                    </div>
                  </div>

                  {/* Compile Job Failed state */}
                  {compileError && (
                    <p className="text-xs text-auth-error bg-auth-error-dim border border-auth-error/20 p-3 rounded-lg">
                      {compileError}
                    </p>
                  )}

                  {/* Timeout Reached */}
                  {pollTimeoutReached && (
                    <div className="flex items-start gap-2 bg-auth-orange-dim border border-auth-orange/20 rounded-lg p-3 text-xs text-auth-text-2">
                      <span>
                        {t("onboarding.seed.timeoutWarning")}
                      </span>
                    </div>
                  )}

                  {/* Polling Terminal Options */}
                  <div className="flex justify-end gap-3 mt-2 border-t border-auth-border-subtle pt-4">
                    {compileJob.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCompileJob(null);
                          setCompileError(null);
                        }}
                      >
                        {t("onboarding.seed.tryAnother")}
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleOnboardingComplete(false)}
                      isLoading={isSubmitting}
                      rightIcon={!isSubmitting ? <LineIcon name="chevron-right" className="h-4 w-4" /> : undefined}
                    >
                      {compileJob.status === "wiki_ready"
                        ? t("onboarding.seed.goToDashboard")
                        : t("onboarding.seed.continue")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* File Upload Zone (MVP hidden/disabled with "Coming Soon" badge) */}
                  <div className="border border-dashed border-auth-border bg-auth-elevated/40 rounded-xl p-4 sm:p-6 text-center flex flex-col gap-3 items-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-auth-accent-dim border border-auth-accent/20 text-auth-accent text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <LineIcon name="lock" className="h-3 w-3" />
                      {t("onboarding.seed.comingSoon")}
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-auth-elevated border border-auth-border flex items-center justify-center text-auth-text-3">
                      <LineIcon name="cloud-upload" className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-auth-text-3">
                        {t("onboarding.seed.dragDrop")}
                      </h4>
                      <p className="text-[10px] text-auth-text-3 mt-1">
                        {t("onboarding.seed.dragDropDesc")}
                      </p>
                    </div>
                  </div>

                  {/* Seed tab headers */}
                  <div className="flex gap-2 border-b border-auth-border-subtle pb-2">
                    <button
                      onClick={() => setSeedType("url")}
                      className={`pb-1.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                        seedType === "url"
                          ? "border-auth-accent text-auth-accent"
                          : "border-transparent text-auth-text-3 hover:text-auth-text-2"
                      }`}
                    >
                      {t("onboarding.seed.tabUrl")}
                    </button>
                    <button
                      onClick={() => setSeedType("text")}
                      className={`pb-1.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                        seedType === "text"
                          ? "border-auth-accent text-auth-accent"
                          : "border-transparent text-auth-text-3 hover:text-auth-text-2"
                      }`}
                    >
                      {t("onboarding.seed.tabText")}
                    </button>
                  </div>

                  {/* Input areas */}
                  {seedType === "url" ? (
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="seed-url"
                        className="text-[10px] font-bold text-auth-text-2 uppercase tracking-wide"
                      >
                        {t("onboarding.seed.labelUrl")}
                      </label>
                      <input
                        id="seed-url"
                        type="url"
                        value={seedUrl}
                        onChange={(e) => setSeedUrl(e.target.value)}
                        placeholder="https://example.com/tai-lieu-ky-thuat"
                        className="bg-auth-elevated border border-auth-border rounded-lg px-4 py-3 text-xs text-auth-text placeholder:text-auth-text-3 focus:border-auth-accent focus:ring-1 focus:ring-auth-accent"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="seed-text"
                        className="text-[10px] font-bold text-auth-text-2 uppercase tracking-wide"
                      >
                        {t("onboarding.seed.labelText")}
                      </label>
                      <textarea
                        id="seed-text"
                        value={seedText}
                        onChange={(e) => setSeedText(e.target.value)}
                        placeholder={t("onboarding.seed.placeholderText")}
                        className="bg-auth-elevated border border-auth-border rounded-lg px-4 py-3 text-xs text-auth-text placeholder:text-auth-text-3 focus:border-auth-accent focus:ring-1 focus:ring-auth-accent min-h-[80px] sm:min-h-[90px] resize-y"
                      />
                      <div className="text-right text-[10px] text-auth-text-3 font-mono">
                        {seedText.length} {t("onboarding.seed.chars")}
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="flex flex-wrap justify-between items-center gap-3 border-t border-auth-border-subtle pt-4 sm:pt-6">
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setCurrentStep("pick_role")}
                      leftIcon={<LineIcon name="arrow-left" className="h-3.5 w-3.5" />}
                    >
                      {t("common.back")}
                    </Button>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => handleOnboardingComplete(true)}
                        disabled={isSubmitting || rateLimitCooldown !== null}
                        isLoading={isSubmitting}
                      >
                        {t("onboarding.seed.skip")}
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSeedIngest}
                        isLoading={isSubmitting}
                        disabled={
                          isSubmitting ||
                          rateLimitCooldown !== null ||
                          (seedType === "text" ? seedText.length < 50 : !seedUrl)
                        }
                        rightIcon={!isSubmitting ? <LineIcon name="chevron-right" className="h-4 w-4" /> : undefined}
                      >
                        {t("onboarding.seed.submit")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Pro upgrade modal */}
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </div>
  );
}
