import { getSession } from "@dashboard/auth/lib/server";
import { SuperAdminDashboard } from "@dashboard/admin/components/SuperAdminDashboard";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/permissions";

export default async function SuperAdminPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/app");
	}

	return <SuperAdminDashboard />;
}
