import { redirect } from "next/navigation";
import { getDemoSession } from "@/lib/session";
import { getDashboard } from "@/lib/store";
import Dashboard from "@/components/dashboard";

export default async function Home() {
  const session = getDemoSession();
  if (!session) redirect("/login");

  const dashboard = await getDashboard();
  return <Dashboard initialData={dashboard} userName={session.user?.name || "Ops Lead"} />;
}
