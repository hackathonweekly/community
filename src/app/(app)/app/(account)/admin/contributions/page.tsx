import { getSession } from "@dashboard/auth/lib/server";
import { ContributionReviewCenter } from "@dashboard/admin/components/ContributionReviewCenter";
import { redirect } from "next/navigation";
import { AdminPermission, hasPermission } from "@/lib/auth/permissions";

export default async function ContributionReviewPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.REVIEW_CONTRIBUTIONS)) {
		return redirect("/app");
	}

	return <ContributionReviewCenter />;
}
