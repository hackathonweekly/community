import { getSession } from "@dashboard/auth/lib/server";
import { NfcManagementCenter } from "@dashboard/admin/components/NfcManagementCenter";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function NfcManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.MANAGE_SYSTEM)) {
		return redirect("/app");
	}

	return <NfcManagementCenter />;
}
