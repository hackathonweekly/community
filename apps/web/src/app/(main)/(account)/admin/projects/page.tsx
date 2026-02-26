import { getSession } from "@shared/auth/lib/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { ProjectsManagement } from "@account/admin/components/ProjectsManagement";

export default async function ProjectsManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/");
	}

	return <ProjectsManagement />;
}
