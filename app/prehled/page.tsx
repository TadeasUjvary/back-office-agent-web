import { getDashboard } from "@/lib/dashboard";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function PrehledPage() {
  const data = getDashboard();
  return <DashboardView data={data} />;
}
