import { getSession } from "@dashboard/auth/lib/server";
import { UserManagementCenter } from "@dashboard/admin/components/UserManagementCenter";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function UserManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_USERS)) {
		return redirect("/app");
	}

	return <UserManagementCenter />;
}
