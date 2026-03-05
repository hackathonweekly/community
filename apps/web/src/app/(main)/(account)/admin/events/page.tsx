import { getSession } from "@shared/auth/lib/server";
import { redirect } from "next/navigation";
import { isAdmin } from "@community/lib-shared/auth/permissions";
import { EventsManagement } from "@account/admin/components/EventsManagement";

export default async function EventsManagementPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!isAdmin(session.user)) {
		return redirect("/");
	}

	return <EventsManagement />;
}
