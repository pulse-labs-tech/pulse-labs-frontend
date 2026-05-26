import { ProtectedRoute } from "@/components/auth/protected-route";
import { ResearchRunDetail } from "@/components/research/research-run-detail";

/**
 * Research Run Detail Page — View trace, sources, claims, synthesis.
 */
export default async function ResearchRunDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <ResearchRunDetail runId={id} />
    </ProtectedRoute>
  );
}
