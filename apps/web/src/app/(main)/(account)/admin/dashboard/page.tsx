import { getSession } from "@shared/auth/lib/server";
import { SuperAdminDashboard } from "@account/admin/components/SuperAdminDashboard";
import { redirect } from "next/navigation";
import { isAdmin } from "@community/lib-shared/auth/permissions";

export default async function SuperAdminPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/");
	}

	return <SuperAdminDashboard />;
}
