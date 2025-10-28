import { getSession } from "@dashboard/auth/lib/server";
import { OrganizationList } from "@dashboard/admin/component/organizations/OrganizationList";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function AdminOrganizationsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_ORGANIZATIONS)) {
		return redirect("/app");
	}

	return <OrganizationList />;
}
