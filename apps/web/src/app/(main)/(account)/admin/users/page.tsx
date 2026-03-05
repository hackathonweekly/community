import { getSession } from "@shared/auth/lib/server";
import { UserManagementCenter } from "@account/admin/components/UserManagementCenter";
import { redirect } from "next/navigation";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";

export default async function UserManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_USERS)) {
		return redirect("/");
	}

	return <UserManagementCenter />;
}
