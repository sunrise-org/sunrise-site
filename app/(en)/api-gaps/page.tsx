import { ApiGapsView } from "@/components/api-gaps-page";
import { pageMetadata } from "@/components/site";
import { getEvidence, getSync } from "@/lib/api-gaps/live";
import { getTeamPulls } from "@/lib/api-gaps/team-prs";

export const metadata = {
  ...pageMetadata({
    title: "Sunrise Gaps: what works and what is missing",
    description: "Where Sunrise stands: what has shipped, what is in progress and what is planned, and every native mod API capability with its status.",
    path: "/api-gaps",
  }),
  robots: { index: false, follow: false },
};

export default async function ApiGapsPage() {
  const [sync, evidence, teamPulls] = await Promise.all([getSync(), getEvidence(), getTeamPulls()]);
  return <ApiGapsView sync={sync} evidence={evidence} teamPulls={teamPulls} />;
}
