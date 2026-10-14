import DashboardShell from "../components/DashboardShell";
import PlansManager from "../components/PlansManager";
import { adminNav } from "../lib/adminNav";

export default function SuperadminPlansPage() {
  return (
    <DashboardShell eyebrow="Superadmin" title="Plans" nav={adminNav}>
      <PlansManager />
    </DashboardShell>
  );
}
