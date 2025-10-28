import { getSession } from "@dashboard/auth/lib/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/permissions";
import { ProjectsManagement } from "@dashboard/admin/components/ProjectsManagement";

export default async function ProjectsManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/app");
	}

	return <ProjectsManagement />;
}
