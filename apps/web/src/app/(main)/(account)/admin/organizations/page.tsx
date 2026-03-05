import { getSession } from "@shared/auth/lib/server";
import { OrganizationList } from "@account/admin/components/organizations/OrganizationList";
import { redirect } from "next/navigation";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";

export default async function AdminOrganizationsPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.VIEW_ORGANIZATIONS)) {
		return redirect("/");
	}

	return <OrganizationList />;
}
