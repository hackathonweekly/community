import { getSession } from "@shared/auth/lib/server";
import { BadgeManagementCenter } from "@account/admin/components/BadgeManagementCenter";
import { redirect } from "next/navigation";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";

export default async function BadgeManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_BADGES)) {
		return redirect("/");
	}

	return <BadgeManagementCenter />;
}
