import { getSession } from "@dashboard/auth/lib/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/permissions";
import { EventsManagement } from "@dashboard/admin/components/EventsManagement";

export default async function EventsManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/app");
	}

	return <EventsManagement />;
}
