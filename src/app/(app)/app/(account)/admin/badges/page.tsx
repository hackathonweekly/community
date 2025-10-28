import { getSession } from "@dashboard/auth/lib/server";
import { BadgeManagementCenter } from "@dashboard/admin/components/BadgeManagementCenter";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function BadgeManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_BADGES)) {
		return redirect("/app");
	}

	return <BadgeManagementCenter />;
}
