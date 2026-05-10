import { requireSession } from "@/lib/auth";
import { getDashboard } from "@/lib/store";
import Dashboard from "@/components/dashboard";

export default async function Home() {
  const user = requireSession();

  const dashboard = await getDashboard();
  return <Dashboard initialData={dashboard} userName={user.name} />;
}
