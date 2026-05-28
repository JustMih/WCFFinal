import { Navigate, useSearchParams } from "react-router-dom";
import { resolveTypeFromLegacyTab, typeToSlug } from "./reportConfig";

export default function LegacyReportRedirect({ defaultSlug = "voice-note" }) {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const resolved = resolveTypeFromLegacyTab(tab);
  const slug = resolved != null ? typeToSlug(resolved) : defaultSlug;
  return <Navigate to={`/reports/${slug}`} replace />;
}
