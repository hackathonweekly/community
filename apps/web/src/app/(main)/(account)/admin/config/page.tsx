import { getSession } from "@shared/auth/lib/server";
import { SystemConfigCenter } from "@account/admin/components/SystemConfigCenter";
import { redirect } from "next/navigation";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";

export default async function SystemConfigPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)) {
		return redirect("/");
	}

	return <SystemConfigCenter />;
}
