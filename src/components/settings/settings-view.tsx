"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LineIcon } from "@/components/shared/line-icon";
import { Button } from "@/components/ui/button";
import { QuotaCard } from "./quota-card";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/contexts/locale-context";
import { logoutAction } from "@/app/actions/auth";
import {
  getSettingsOverviewAction,
  recordUpgradeIntentAction,
  getOnboardingStateAction,
  getRoleOptionsAction,
  saveRolesAction,
  completeOnboardingAction,
  getClientAccessToken,
  setStoredRoleKbId,
  getCurrentUserAction,
  getDashboardSummaryAction,
} from "@/lib/client-api";
import type {
  SettingsOverviewData,
  QuotaCardData,
  UpgradeIntentStatus,
  SettingsErrorCode,
} from "@/types/settings";
import type {
  RoleGroup,
  RoleGroupOption,
  RoleOption,
  SaveRoleInput,
} from "@/types/onboarding";
import { AppHeader } from "@/components/layout";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { DotMatrixLoader } from "@/components/ui/dot-matrix-loader";
import Loading from "@/app/[locale]/loading";

interface SettingsViewProps {
  initialSection?: "plan" | "upgrade" | "quota";
}

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

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  EMAIL_NOT_VERIFIED: "Vui lòng xác thực email để tiếp tục.",
  ONBOARDING_REQUIRED: "Hoàn tất onboarding để tiếp tục.",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  QUOTA_UNAVAILABLE: "Chưa tải được hạn mức. Thử lại sau.",
  SETTINGS_SECTION_UNAVAILABLE: "Một phần Settings chưa tải được.",
  UPGRADE_INTENT_FAILED: "Chưa thể ghi nhận yêu cầu nâng cấp. Thử lại sau.",
  LOGOUT_FAILED: "Chưa thể đăng xuất. Thử lại sau.",
  RATE_LIMITED: "Thao tác quá nhanh. Vui lòng thử lại sau.",
  SERVER_ERROR: "Có lỗi xảy ra. Thử lại sau.",
  NETWORK_ERROR: "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.",
};

export function SettingsView({ initialSection }: SettingsViewProps) {
  const router = useRouter();
  const { user: authUser, setUser, clearAuth } = useAuth();
  const { t, locale } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [overview, setOverview] = useState<SettingsOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeIntentStatus | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isRefreshingQuota, setIsRefreshingQuota] = useState(false);

  // Specialization & Role setup states
  const [roleGroups, setRoleGroups] = useState<RoleGroupOption[]>(STATIC_ROLE_GROUPS);
  const [activeGroup, setActiveGroup] = useState<RoleGroup>("engineering");
  const [selectedRoles, setSelectedRoles] = useState<{
    id: string;
    label: string;
    group: RoleGroup;
    isCustom: boolean;
  }[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);

  const handleError = useCallback(
    (code: string) => {
      if (code === "UNAUTHORIZED") {
        clearAuth();
        router.push(`/${locale}/login`);
        return;
      }
      setGlobalError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_ERROR);
    },
    [clearAuth, router, locale]
  );

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const res = await getSettingsOverviewAction();
      console.log("🟢 [F12 API RESPONSE] getSettingsOverviewAction:", res);
      if (res.status === "1" && res.data) {
        setOverview(res.data);
        if (res.data.upgradeIntent?.status && res.data.upgradeIntent.status !== "none") {
          setUpgradeStatus(res.data.upgradeIntent.status);
        }
      } else {
        // Fallback: Assemble overview dynamically using working APIs
        const userRes = await getCurrentUserAction();
        if (userRes.status === "1" && userRes.data) {
          const u = userRes.data;
          const roles = u.roles || [];
          const primaryRole = roles.find((r: any) => r.isPrimary) || roles[0];
          
          let sUsedQueries = 0;
          let sLimitQueries: number | null = u.plan === "pro" ? null : 30;
          let sUsedCompiles = 0;
          let sLimitCompiles: number | null = u.plan === "pro" ? null : 20;
          let sUsedStorage = 0;
          let sLimitStorage = u.plan === "pro" ? 10737418240 : 524288000;

          if (primaryRole?.id) {
            try {
              const dashRes = await getDashboardSummaryAction(primaryRole.id);
              if (dashRes.status === "1" && dashRes.data) {
                const ds = dashRes.data.stats;
                const dq = dashRes.data.quota;
                sUsedQueries = ds?.queriesUsedToday ?? dq?.queries?.used ?? 0;
                sLimitQueries = u.plan === "pro" ? null : (ds?.queriesLimitToday ?? dq?.queries?.limit ?? 30);
                sUsedCompiles = ds?.compilesUsedThisMonth ?? dq?.compiles?.used ?? 0;
                sLimitCompiles = u.plan === "pro" ? null : (ds?.compilesLimitThisMonth ?? dq?.compiles?.limit ?? 20);
                sUsedStorage = ds?.storageUsedBytes ?? dq?.storage?.usedBytes ?? 0;
                sLimitStorage = ds?.storageLimitBytes ?? dq?.storage?.limitBytes ?? (u.plan === "pro" ? 10737418240 : 524288000);
              }
            } catch (dashErr) {
              console.error("Failed to load dashboard summary for settings fallback:", dashErr);
            }
          }

          const quotasData: QuotaCardData[] = [
            {
              key: "role_kbs",
              label: locale === "vi" ? "Knowledge Bases" : "Knowledge Bases",
              used: roles.length,
              limit: u.plan === "pro" ? 5 : 1,
              percentage: Math.min(100, Math.round((roles.length / (u.plan === "pro" ? 5 : 1)) * 100)),
              window: "none",
              resetsAt: null,
              status: roles.length >= (u.plan === "pro" ? 5 : 1) ? "exceeded" : "ok",
            },
            {
              key: "storage",
              label: locale === "vi" ? "Dung lượng lưu trữ" : "Storage",
              used: sUsedStorage,
              limit: sLimitStorage,
              percentage: sLimitStorage ? Math.min(100, Math.round((sUsedStorage / sLimitStorage) * 100)) : null,
              window: "none",
              resetsAt: null,
              status: sLimitStorage && sUsedStorage >= sLimitStorage ? "exceeded" : "ok",
            },
            {
              key: "queries",
              label: locale === "vi" ? "Hỏi đáp AI hàng ngày" : "Daily Queries",
              used: sUsedQueries,
              limit: sLimitQueries,
              percentage: sLimitQueries ? Math.min(100, Math.round((sUsedQueries / sLimitQueries) * 100)) : null,
              window: "daily",
              resetsAt: null,
              status: sLimitQueries && sUsedQueries >= sLimitQueries ? "exceeded" : "ok",
            },
            {
              key: "compiles",
              label: locale === "vi" ? "Nạp tài liệu hàng tháng" : "Monthly Ingests",
              used: sUsedCompiles,
              limit: sLimitCompiles,
              percentage: sLimitCompiles ? Math.min(100, Math.round((sUsedCompiles / sLimitCompiles) * 100)) : null,
              window: "monthly",
              resetsAt: null,
              status: sLimitCompiles && sUsedCompiles >= sLimitCompiles ? "exceeded" : "ok",
            }
          ];

          const overviewData: SettingsOverviewData = {
            user: {
              id: u.id,
              email: u.email,
              displayName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
              isEmailVerified: true,
              plan: u.plan as "free" | "pro",
              selectedPlanIntent: u.plan as "free" | "pro",
              primaryRoleName: primaryRole?.roleName || null,
              primaryRoleKbId: primaryRole?.id || null,
            },
            currentPlan: {
              code: u.plan as "free" | "pro",
              displayName: u.plan === "pro" ? "Pro Plan" : "Free Plan",
              features: [],
            },
            plans: [
              {
                code: "free",
                displayName: "Free Plan",
                features: [],
              },
              {
                code: "pro",
                displayName: "Pro Plan",
                features: [],
              }
            ],
            quotas: quotasData,
            upgradeIntent: {
              status: "none",
              recordedAt: null,
            },
            sectionErrors: [],
            serverTime: new Date().toISOString(),
          };
          setOverview(overviewData);
        } else {
          const code = res.error_code as SettingsErrorCode;
          if (["UNAUTHORIZED", "EMAIL_NOT_VERIFIED", "ONBOARDING_REQUIRED"].includes(code)) {
            handleError(code);
          } else {
            setGlobalError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.SERVER_ERROR);
          }
        }
      }
    } catch {
      // Fallback: Assemble overview dynamically on network/unhandled exception too
      try {
        const userRes = await getCurrentUserAction();
        if (userRes.status === "1" && userRes.data) {
          const u = userRes.data;
          const roles = u.roles || [];
          const primaryRole = roles.find((r: any) => r.isPrimary) || roles[0];
          
          let sUsedQueries = 0;
          let sLimitQueries: number | null = u.plan === "pro" ? null : 30;
          let sUsedCompiles = 0;
          let sLimitCompiles: number | null = u.plan === "pro" ? null : 20;
          let sUsedStorage = 0;
          let sLimitStorage = u.plan === "pro" ? 10737418240 : 524288000;

          if (primaryRole?.id) {
            try {
              const dashRes = await getDashboardSummaryAction(primaryRole.id);
              if (dashRes.status === "1" && dashRes.data) {
                const ds = dashRes.data.stats;
                const dq = dashRes.data.quota;
                sUsedQueries = ds?.queriesUsedToday ?? dq?.queries?.used ?? 0;
                sLimitQueries = u.plan === "pro" ? null : (ds?.queriesLimitToday ?? dq?.queries?.limit ?? 30);
                sUsedCompiles = ds?.compilesUsedThisMonth ?? dq?.compiles?.used ?? 0;
                sLimitCompiles = u.plan === "pro" ? null : (ds?.compilesLimitThisMonth ?? dq?.compiles?.limit ?? 20);
                sUsedStorage = ds?.storageUsedBytes ?? dq?.storage?.usedBytes ?? 0;
                sLimitStorage = ds?.storageLimitBytes ?? dq?.storage?.limitBytes ?? (u.plan === "pro" ? 10737418240 : 524288000);
              }
            } catch (dashErr) {}
          }

          const quotasData: QuotaCardData[] = [
            {
              key: "role_kbs",
              label: locale === "vi" ? "Knowledge Bases" : "Knowledge Bases",
              used: roles.length,
              limit: u.plan === "pro" ? 5 : 1,
              percentage: Math.min(100, Math.round((roles.length / (u.plan === "pro" ? 5 : 1)) * 100)),
              window: "none",
              resetsAt: null,
              status: roles.length >= (u.plan === "pro" ? 5 : 1) ? "exceeded" : "ok",
            },
            {
              key: "storage",
              label: locale === "vi" ? "Dung lượng lưu trữ" : "Storage",
              used: sUsedStorage,
              limit: sLimitStorage,
              percentage: sLimitStorage ? Math.min(100, Math.round((sUsedStorage / sLimitStorage) * 100)) : null,
              window: "none",
              resetsAt: null,
              status: sLimitStorage && sUsedStorage >= sLimitStorage ? "exceeded" : "ok",
            },
            {
              key: "queries",
              label: locale === "vi" ? "Hỏi đáp AI hàng ngày" : "Daily Queries",
              used: sUsedQueries,
              limit: sLimitQueries,
              percentage: sLimitQueries ? Math.min(100, Math.round((sUsedQueries / sLimitQueries) * 100)) : null,
              window: "daily",
              resetsAt: null,
              status: sLimitQueries && sUsedQueries >= sLimitQueries ? "exceeded" : "ok",
            },
            {
              key: "compiles",
              label: locale === "vi" ? "Nạp tài liệu hàng tháng" : "Monthly Ingests",
              used: sUsedCompiles,
              limit: sLimitCompiles,
              percentage: sLimitCompiles ? Math.min(100, Math.round((sUsedCompiles / sLimitCompiles) * 100)) : null,
              window: "monthly",
              resetsAt: null,
              status: sLimitCompiles && sUsedCompiles >= sLimitCompiles ? "exceeded" : "ok",
            }
          ];

          const overviewData: SettingsOverviewData = {
            user: {
              id: u.id,
              email: u.email,
              displayName: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
              isEmailVerified: true,
              plan: u.plan as "free" | "pro",
              selectedPlanIntent: u.plan as "free" | "pro",
              primaryRoleName: primaryRole?.roleName || null,
              primaryRoleKbId: primaryRole?.id || null,
            },
            currentPlan: {
              code: u.plan as "free" | "pro",
              displayName: u.plan === "pro" ? "Pro Plan" : "Free Plan",
              features: [],
            },
            plans: [
              {
                code: "free",
                displayName: "Free Plan",
                features: [],
              },
              {
                code: "pro",
                displayName: "Pro Plan",
                features: [],
              }
            ],
            quotas: quotasData,
            upgradeIntent: {
              status: "none",
              recordedAt: null,
            },
            sectionErrors: [],
            serverTime: new Date().toISOString(),
          };
          setOverview(overviewData);
        } else {
          setGlobalError(ERROR_MESSAGES.NETWORK_ERROR);
        }
      } catch {
        setGlobalError(ERROR_MESSAGES.NETWORK_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleError, locale]);

  const initRoles = useCallback(async () => {
    try {
      const [userRes, stateRes, optionsRes] = await Promise.all([
        getCurrentUserAction(),
        getOnboardingStateAction(),
        getRoleOptionsAction(),
      ]);

      let roles: any[] = [];
      if (userRes.status === "1" && userRes.data?.roles && userRes.data.roles.length > 0) {
        roles = userRes.data.roles;
      } else if (stateRes.status === "1" && stateRes.data?.roles) {
        roles = stateRes.data.roles;
      }

      if (roles.length > 0) {
        setSelectedRoles(
          roles.map((r: any) => ({
            id: r.roleOptionId || r.id,
            label: r.roleName,
            group: r.roleGroup,
            isCustom: r.isCustom,
          }))
        );
      }

      if (optionsRes.status === "1" && optionsRes.data?.groups) {
        const normalized: RoleGroupOption[] = optionsRes.data.groups.map((g: any) => {
          const groupId = (g.id || g.group || "") as RoleGroup;
          const normalizedRoles: RoleOption[] = (g.roles ?? []).map((r: any) => ({
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
      console.error("Failed to load roles setup:", err);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    initRoles();
  }, [loadOverview, initRoles]);

  const isPro = overview?.user?.plan === "pro";

  const handlePickDomain = (group: RoleGroup) => {
    setActiveGroup(group);
    setRoleError(null);
    setRoleSuccess(null);
  };

  const handlePickRole = (roleOptionId: string, label: string) => {
    setRoleError(null);
    setRoleSuccess(null);

    const isAlreadySelected = selectedRoles.some((r) => r.id === roleOptionId);

    if (isAlreadySelected) {
      setSelectedRoles(selectedRoles.filter((r) => r.id !== roleOptionId));
      return;
    }

    if (!isPro) {
      // Free limit: 1 role
      setSelectedRoles([{ id: roleOptionId, label, group: activeGroup, isCustom: false }]);
    } else {
      // Pro limit: 5 roles
      if (selectedRoles.length >= 5) {
        setRoleError(t("onboarding.pickRole.customLimit", "Pro plan hỗ trợ tối đa 5 Role KB trong giai đoạn thiết lập ban đầu."));
        return;
      }
      setSelectedRoles([
        ...selectedRoles,
        { id: roleOptionId, label, group: activeGroup, isCustom: false }
      ]);
    }
  };

  const handleCustomRoleSubmit = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;

    if (trimmed.length < 2 || trimmed.length > 80) {
      setRoleError(t("onboarding.pickRole.customLengthError", "Role cần ít nhất từ 2 đến 80 ký tự."));
      return;
    }

    setRoleError(null);
    setRoleSuccess(null);

    if (!isPro) {
      setSelectedRoles([
        { id: `custom_${Date.now()}`, label: trimmed, group: "other", isCustom: true }
      ]);
      setCustomRoleInput("");
    } else {
      if (selectedRoles.length >= 5) {
        setRoleError(t("onboarding.pickRole.customLimit", "Pro plan hỗ trợ tối đa 5 Role KB trong giai đoạn thiết lập ban đầu."));
        return;
      }
      setSelectedRoles([
        ...selectedRoles,
        { id: `custom_${Date.now()}`, label: trimmed, group: "other", isCustom: true }
      ]);
      setCustomRoleInput("");
    }
  };

  const handleRemoveRole = (id: string) => {
    setSelectedRoles(selectedRoles.filter((r) => r.id !== id));
    setRoleError(null);
    setRoleSuccess(null);
  };

  const handleSaveRoles = async () => {
    if (selectedRoles.length === 0) {
      setRoleError(t("onboarding.errors.ROLE_REQUIRED", "Chọn một vai trò để Pulse tạo Knowledge Base cho bạn."));
      return;
    }

    setIsSavingRoles(true);
    setRoleError(null);
    setRoleSuccess(null);

    try {
      const rolesInput: SaveRoleInput[] = selectedRoles.map((r, index) => ({
        roleOptionId: r.isCustom ? null : r.id,
        roleName: r.label,
        roleGroup: r.group,
        isCustom: r.isCustom,
        isPrimary: index === 0,
      }));

      const res = await saveRolesAction(rolesInput);
      console.log("🟢 [Settings Roles] saveRolesAction response:", res);

      if (res.status === "1") {
        const returnedRoles = res.data?.roles;
        let primaryRoleKbId = "";
        if (returnedRoles && returnedRoles.length > 0) {
          const primaryRole = returnedRoles.find((r: any) => r.isPrimary) ?? returnedRoles[0];
          if (primaryRole) {
            primaryRoleKbId = primaryRole.id;
            setStoredRoleKbId(primaryRole.id);
          }
        }

        // If user missed onboarding, complete onboarding
        if (authUser && authUser.onboardingStatus !== "completed") {
          const completeRes = await completeOnboardingAction({
            seedSkipped: true,
            compileJobId: null,
            idempotencyKey: Math.random().toString(36).substring(2, 15),
          });
          console.log("🟢 [Settings Roles] completeOnboardingAction response:", completeRes);
        }

        // Force refresh access token to sync JWT claims/permissions
        try {
          await getClientAccessToken(true);
        } catch (refreshErr) {
          console.error("Failed to refresh token in settings:", refreshErr);
        }

        // Update the user profile context state locally
        if (authUser) {
          setUser({
            ...authUser,
            onboardingStatus: "completed",
            roleKbId: primaryRoleKbId || authUser.roleKbId,
          });
        }

        // Reload overview to update Settings UI
        await loadOverview();

        setRoleSuccess(locale === "vi" ? "Đã lưu chuyên ngành và Knowledge Base thành công!" : "Successfully saved specialization and Knowledge Base!");
      } else {
        setRoleError(res.msg || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Save roles in settings error:", err);
      setRoleError(t("auth.errors.NETWORK_ERROR", "Không kết nối được máy chủ. Kiểm tra mạng và thử lại."));
    } finally {
      setIsSavingRoles(false);
    }
  };

  // Scroll to initial section on load
  useEffect(() => {
    if (!isLoading && initialSection) {
      const el = document.getElementById(`settings-section-${initialSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [isLoading, initialSection]);

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await recordUpgradeIntentAction({
        targetPlan: "pro",
        source: "settings_page",
      });
      console.log("🟢 [F12 API RESPONSE] recordUpgradeIntentAction (settings):", res);
      if (res.status === "1" && res.data?.intent) {
        setUpgradeStatus(res.data.intent.status);
        // Reload overview to reflect intent in plan card
        await loadOverview();
      } else {
        setUpgradeError(ERROR_MESSAGES[res.error_code] ?? ERROR_MESSAGES.UPGRADE_INTENT_FAILED);
      }
    } catch {
      setUpgradeError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setLogoutError(null);
    startTransition(async () => {
      try {
        clearAuth();
        await logoutAction();
      } catch {
        setLogoutError(ERROR_MESSAGES.LOGOUT_FAILED);
        setIsLoggingOut(false);
      }
    });
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return <Loading />;
  }

  // ─── Global error (no data) ─────────────────────────────────────
  if (globalError && !overview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-auth-bg px-4 gap-4">
        <div className="w-full max-w-md rounded-2xl p-6 text-center shadow-auth relative premium-hover-card-red">
          <div className="w-12 h-12 rounded-full bg-auth-error-dim text-auth-error flex items-center justify-center mx-auto mb-4">
            <LineIcon name="warning" className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {t("settings.errors.loadFailed", "Không tải được Settings")}
          </h2>
          <p className="text-sm text-auth-text-2 mt-2 leading-relaxed">{globalError}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={loadOverview}
              leftIcon={<LineIcon name="sync" className="h-4 w-4" />}
            >
              {t("common.retry", "Thử lại")}
            </Button>
            <Link href={`/${locale}/dashboard`} className="block">
              <Button variant="ghost" size="lg" fullWidth leftIcon={<LineIcon name="arrow-left" className="h-4 w-4" />}>
                {t("common.backToDashboard", "Về Dashboard")}
              </Button>
            </Link>
            <Button variant="ghost" size="lg" fullWidth onClick={handleLogout}
              className="text-auth-text-3 hover:text-red-400 text-xs"
            >
              {t("common.logout", "Đăng xuất")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { user: userCtx, currentPlan, plans, quotas, upgradeIntent } = overview!;
  const hasUpgradeIntent =
    upgradeStatus === "recorded" ||
    upgradeStatus === "checkout_pending" ||
    (upgradeIntent?.status && upgradeIntent.status !== "none" && upgradeIntent.status !== "failed");

  const proPlan = plans?.find((p) => p.code === "pro");
  const freePlan = plans?.find((p) => p.code === "free") ?? currentPlan;

  return (
    <div className="min-h-screen bg-auth-bg text-white relative overflow-x-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/3 blur-[100px]"
        style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Header */}
      <AppHeader active="settings" locale={locale} />
      <header className="hidden">
        <div className="container-focused flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard`} prefetch={false} className="text-auth-text-2 hover:text-white transition-colors text-sm">
              ← {t("common.dashboard", "Dashboard")}
            </Link>
            <LineIcon name="chevron-right" className="h-3.5 w-3.5 text-auth-text-3" />
            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
              <LineIcon name="gear" className="h-3.5 w-3.5 text-auth-accent" />
              {t("settings.title", "Cài đặt")}
            </span>
          </div>
          <LocaleSwitcher id="settings-header" />
        </div>
      </header>

      <main className="container-focused py-8 space-y-6 relative z-10" id="main-content">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t("settings.title", "Cài đặt")}
          </h1>
          <p className="text-sm text-auth-text-2 mt-1">
            {t("settings.subtitle", "Quản lý tài khoản, gói dịch vụ và hạn mức sử dụng.")}
          </p>
        </div>

        {/* Non-critical warning if overview has section errors */}
        {overview?.sectionErrors && overview.sectionErrors.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-xs text-amber-300">
            <LineIcon name="warning" className="h-4 w-4 shrink-0" />
            <span>{t("settings.errors.partialLoad", "Một số phần Settings chưa tải được. Thông tin còn lại vẫn hiển thị đầy đủ.")}</span>
            <button
              onClick={loadOverview}
              className="ml-auto shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              {t("common.retry", "Thử lại")}
            </button>
          </div>
        )}

        {/* ─── Account + Plan row ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account summary */}
          <section
            className="flex flex-col gap-4 rounded-2xl p-5 relative premium-hover-card"
            aria-labelledby="settings-account-heading"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                <LineIcon name="user" className="h-3.5 w-3.5 text-auth-accent" />
              </div>
              <h2 id="settings-account-heading" className="text-sm font-bold text-white">
                {t("settings.account.title", "Tài khoản")}
              </h2>
            </div>

            <div className="space-y-2.5">
              {/* Display name / email */}
              <div>
                <p className="text-base font-bold text-white">
                  {userCtx.displayName || userCtx.email}
                </p>
                {userCtx.displayName && (
                  <p className="text-xs text-auth-text-2">{userCtx.email}</p>
                )}
              </div>

              {/* Plan badge */}
              <div className="flex items-center gap-2">
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300">
                    <LineIcon name="crown" className="h-3 w-3" />
                    Pro Plan
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-auth-elevated border border-auth-border text-auth-text-2">
                    Free Plan
                  </span>
                )}

                {/* Email verified indicator */}
                {userCtx.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-accent-dim border border-auth-accent/20 text-auth-accent">
                    <LineIcon name="checkmark-circle" className="h-3 w-3" />
                    {t("settings.account.verified", "Đã xác thực")}
                  </span>
                )}
              </div>

              {/* Primary Role KB */}
              {userCtx.primaryRoleName && (
                <p className="text-xs text-auth-text-2">
                  <span className="text-auth-text-3">{t("settings.account.primaryRole", "Role KB:")} </span>
                  {userCtx.primaryRoleName}
                </p>
              )}
            </div>
          </section>

          {/* Current plan card */}
          <section
            id="settings-section-plan"
            className={`flex flex-col gap-4 rounded-2xl p-5 relative ${
              isPro ? "premium-hover-card-amber" : "premium-hover-card"
            }`}
            style={{
              borderColor: isPro ? "rgba(245, 158, 11, 0.3)" : undefined,
            }}
            aria-labelledby="settings-plan-heading"
          >

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isPro ? "bg-amber-500/20" : "bg-auth-accent-dim"}`}>
                  {isPro ? <LineIcon name="crown" className="h-3.5 w-3.5 text-amber-400" /> : <LineIcon name="shield" className="h-3.5 w-3.5 text-auth-accent" />}
                </div>
                <h2 id="settings-plan-heading" className="text-sm font-bold text-white">
                  {t("settings.plan.title", "Gói dịch vụ hiện tại")}
                </h2>
              </div>
              {isPro ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-auth-elevated border border-auth-border text-auth-text-3">
                  FREE
                </span>
              )}
            </div>

            <div>
              <p className="text-xl font-extrabold text-white">
                {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              {!isPro && hasUpgradeIntent && (
                <p className="text-xs text-amber-300 mt-1 flex items-center gap-1.5">
                  <LineIcon name="checkmark-circle" className="h-3 w-3" />
                  {t("settings.plan.upgradeIntentRecorded", "Đã ghi nhận yêu cầu nâng cấp. Gói hiện tại vẫn là Free.")}
                </p>
              )}
              {!isPro && !hasUpgradeIntent && (
                <p className="text-xs text-auth-text-2 mt-1">
                  {t("settings.plan.freeDesc", "1 Role KB · 500 MB · 20 compiles/tháng · 30 câu hỏi/ngày")}
                </p>
              )}
              {isPro && (
                <p className="text-xs text-auth-text-2 mt-1">
                  {t("settings.plan.proDesc", "5 Role KB · 10 GB · Unlimited compiles · Unlimited queries")}
                </p>
              )}
            </div>

            {/* Upgrade CTA for free users */}
            {!isPro && (
              <div className="space-y-2 mt-auto">
                {upgradeError && (
                  <p className="text-xs text-red-300">{upgradeError}</p>
                )}
                {hasUpgradeIntent ? (
                  <Link href={`/${locale}/settings/plan/upgrade`}>
                    <Button variant="ghost" size="sm" fullWidth rightIcon={<LineIcon name="arrow-right" className="h-3.5 w-3.5" />}>
                      {t("settings.plan.viewUpgrade", "Xem trạng thái nâng cấp")}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={handleUpgrade}
                    isLoading={isUpgrading}
                    leftIcon={<LineIcon name="bolt" className="h-3.5 w-3.5" />}
                  >
                    {t("settings.plan.upgradeCta", "Nâng cấp lên Pro")}
                  </Button>
                )}
              </div>
            )}

            {isPro && (
              <p className="text-xs text-auth-text-3 mt-auto">
                {t("settings.plan.proCurrentNote", "Bạn đang sử dụng gói Pro.")}
              </p>
            )}
          </section>
        </div>

        {/* ─── Role / Specialization setup ─── */}
        <section
          id="settings-section-role"
          className="rounded-2xl border border-auth-border bg-auth-surface p-6 flex flex-col gap-6 relative premium-hover-card"
          aria-labelledby="settings-role-heading"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
              <LineIcon name="book" className="h-3.5 w-3.5 text-auth-accent" />
            </div>
            <h2 id="settings-role-heading" className="text-sm font-bold text-white uppercase tracking-wider">
              {locale === "vi" ? "Chuyên ngành & Knowledge Base" : "Specialization & Knowledge Base"}
            </h2>
          </div>

          <p className="text-xs text-auth-text-2">
            {locale === "vi"
              ? "Thiết lập các vai trò chuyên môn để Pulse Knowledge tùy chỉnh cơ sở tri thức phù hợp với công việc của bạn."
              : "Set up professional roles to tailor Pulse Knowledge bases for your work."}
          </p>

          {/* Active / selected roles preview */}
          {selectedRoles.length > 0 && (
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[10px] font-bold text-auth-text-3 uppercase tracking-wider">
                {locale === "vi" ? "Vai trò đang chọn" : "Selected roles"} ({selectedRoles.length}/{isPro ? 5 : 1}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-auth-accent-dim border border-auth-accent/30 text-auth-text"
                  >
                    <span>{r.label}</span>
                    <button
                      onClick={() => handleRemoveRole(r.id)}
                      className="hover:bg-auth-accent-dark/20 rounded-full p-0.5 cursor-pointer"
                    >
                      <LineIcon name="xmark" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Domain Chips */}
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[10px] font-bold text-auth-text-3 uppercase tracking-wider">
              {locale === "vi" ? "Lĩnh vực chuyên môn" : "Domain Group"}
            </span>
            <div className="flex gap-2 flex-wrap">
              {roleGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handlePickDomain(group.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    activeGroup === group.id
                      ? "bg-auth-accent-dim border-auth-accent text-auth-accent"
                      : "bg-auth-elevated border-auth-border text-auth-text-2 hover:border-white/[0.15] hover:text-white"
                  }`}
                >
                  {t("onboarding.groups." + group.id + ".label", group.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Roles Cards Grid */}
          <div className="flex flex-col gap-2 text-left">
            <span className="text-[10px] font-bold text-auth-text-3 uppercase tracking-wider">
              {locale === "vi" ? "Chọn vai trò chi tiết" : "Select Specific Role"}
            </span>

            {activeGroup !== "other" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {roleGroups
                  .find((g) => g.id === activeGroup)
                  ?.roles.map((role) => {
                    const isSelected = selectedRoles.some((r) => r.id === role.id);
                    return (
                      <button
                        key={role.id}
                        onClick={() => handlePickRole(role.id, role.label)}
                        className={`flex flex-col items-start text-left gap-1 p-3.5 rounded-xl border cursor-pointer transition-all relative ${
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
                        <span className="text-xs font-bold text-white leading-snug">
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
                  className="text-xs font-bold text-auth-text-2 tracking-wide uppercase"
                >
                  {t("onboarding.pickRole.customLabel", "Vai trò tùy chỉnh")}
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-role"
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder={t("onboarding.pickRole.customPlaceholder", "Ví dụ: Growth Hacker, Product Lead...")}
                    className="flex-grow bg-auth-surface border border-auth-border rounded-lg px-4 py-2 text-xs text-white placeholder:text-auth-text-3 focus:border-auth-accent"
                    maxLength={80}
                  />
                  <Button
                    onClick={handleCustomRoleSubmit}
                    variant="secondary"
                    size="md"
                  >
                    {t("common.add", "Thêm")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action / Error / Success message */}
          <div className="flex flex-col gap-3 mt-2">
            {roleError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-xs text-red-300">
                <LineIcon name="warning" className="h-4 w-4 shrink-0" />
                <span>{roleError}</span>
              </div>
            )}

            {roleSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">
                <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                <span>{roleSuccess}</span>
              </div>
            )}

            <Button
              onClick={handleSaveRoles}
              isLoading={isSavingRoles}
              variant="primary"
              size="md"
              leftIcon={<LineIcon name="save" className="h-3.5 w-3.5" />}
              className="self-start btn-primary-pulse"
            >
              {locale === "vi" ? "Lưu vai trò chuyên môn" : "Save specialization"}
            </Button>
          </div>
        </section>

        {/* ─── Plan comparison ─── */}
        {!isPro && proPlan && (
          <section
            id="settings-section-upgrade"
            className="rounded-2xl p-6 relative premium-hover-card"
            aria-labelledby="settings-compare-heading"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-auth-accent-dim flex items-center justify-center">
                <LineIcon name="star" className="h-3.5 w-3.5 text-auth-accent" />
              </div>
              <h2 id="settings-compare-heading" className="text-sm font-bold text-white uppercase tracking-wider">
                {t("settings.compare.title", "So sánh gói dịch vụ")}
              </h2>
            </div>

            <div className="plan-cards-container">
              {/* Free Plan Card */}
              <div className="plan-card-premium active-tier">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="plan-card-title">Free Plan</h3>
                    <p className="text-[10px] text-auth-accent font-semibold uppercase tracking-wider mt-0.5">
                      {locale === "vi" ? "Gói hiện tại" : "Current Plan"}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-auth-text-3">
                    FREE
                  </span>
                </div>
                <div className="plan-card-price">
                  $0<span>/tháng</span>
                </div>
                <p className="plan-card-desc text-xs text-auth-text-2">
                  {locale === "vi"
                    ? "Công cụ cơ bản để bắt đầu xây dựng cơ sở tri thức của bạn"
                    : "Essential tools to start building your knowledge base"}
                </p>
                <div className="plan-card-divider" />
                <div className="plan-feature-list">
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>1 Role KB</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>500 MB storage</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>20 compiles / tháng</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>30 queries / ngày</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>3 domains max</span>
                  </div>
                  <div className="plan-feature-item excluded">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0" />
                    <span>Multi-role profiles</span>
                  </div>
                  <div className="plan-feature-item excluded">
                    <LineIcon name="warning" className="h-4 w-4 shrink-0" />
                    <span>Auto-Heal features</span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-2 bg-white/5 text-auth-text-3 font-semibold rounded-lg text-xs cursor-not-allowed border border-white/[0.04]"
                >
                  {locale === "vi" ? "Gói hiện tại" : "Current Plan"}
                </button>
              </div>

              {/* Pro Plan Card */}
              <div className="plan-card-premium pro-tier">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="plan-card-title text-auth-purple">Pro Plan</h3>
                    <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mt-0.5">
                      {locale === "vi" ? "Khuyên dùng" : "Recommended"}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    PRO
                  </span>
                </div>
                <div className="plan-card-price">
                  $19<span>/tháng</span>
                </div>
                <p className="plan-card-desc text-xs text-auth-text-2">
                  {locale === "vi"
                    ? "~450.000 VNĐ/tháng · Dành cho cá nhân và nhóm chuyên nghiệp"
                    : "For professionals and growing teams needing custom workflows"}
                </p>
                <div className="plan-card-divider" />
                <div className="plan-feature-list">
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span><strong>5</strong> Role KBs</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span><strong>10 GB</strong> storage</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited compiles</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited queries</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Unlimited domains</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Multi-role profiles</span>
                  </div>
                  <div className="plan-feature-item included">
                    <LineIcon name="checkmark-circle" className="h-4 w-4 shrink-0" />
                    <span>Auto-Heal enabled</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={handleUpgrade}
                  isLoading={isUpgrading}
                  leftIcon={<LineIcon name="bolt" className="h-3.5 w-3.5" />}
                >
                  {hasUpgradeIntent
                    ? (locale === "vi" ? "Đã ghi nhận yêu cầu" : "Recorded interest")
                    : (locale === "vi" ? "Nâng cấp lên Pro" : "Upgrade to Pro")}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ─── Quota cards ─── */}
        <section
          id="settings-section-quota"
          aria-labelledby="settings-quota-heading"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 id="settings-quota-heading" className="text-sm font-bold text-white">
              {t("settings.quota.title", "Hạn mức sử dụng")}
            </h2>
            <button
              onClick={loadOverview}
              disabled={isLoading || isRefreshingQuota}
              className="flex items-center gap-1.5 text-xs text-auth-text-2 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <LineIcon name="sync" className={`h-3.5 w-3.5 ${isRefreshingQuota ? "animate-spin" : ""}`} />
              {t("common.retry", "Làm mới")}
            </button>
          </div>

          {quotas && quotas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quotas.map((quota) => (
                <QuotaCard
                  key={quota.key}
                  quota={quota}
                  onRetry={quota.status === "unavailable" ? loadOverview : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-auth-text-3 text-center py-8 rounded-xl border border-auth-border bg-auth-surface">
              {t("settings.quota.noData", "Chưa tải được dữ liệu hạn mức.")}
            </div>
          )}
        </section>

        {/* ─── Logout section ─── */}
        <section
          className="rounded-2xl border border-auth-border bg-auth-surface p-5"
          aria-labelledby="settings-logout-heading"
        >
          <h2 id="settings-logout-heading" className="text-sm font-bold text-white mb-3">
            {t("settings.logout.title", "Phiên đăng nhập")}
          </h2>
          <p className="text-xs text-auth-text-2 mb-4">
            {t("settings.logout.desc", "Đăng xuất khỏi tài khoản trên thiết bị này. Dữ liệu của bạn sẽ được bảo toàn.")}
          </p>
          {logoutError && (
            <p className="text-xs text-red-300 mb-3">{logoutError}</p>
          )}
          <Button
            variant="ghost"
            size="md"
            onClick={handleLogout}
            isLoading={isLoggingOut || isPending}
            leftIcon={<LineIcon name="exit" className="h-4 w-4" />}
            className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-400/30 hover:bg-red-950/20"
          >
            {t("common.logout", "Đăng xuất")}
          </Button>
        </section>
      </main>
    </div>
  );
}
