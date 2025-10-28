import { getSession } from "@dashboard/auth/lib/server";
import { SystemConfigCenter } from "@dashboard/admin/components/SystemConfigCenter";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function SystemConfigPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)) {
		return redirect("/app");
	}

	return <SystemConfigCenter />;
}
