import { getSession } from "@shared/auth/lib/server";
import { ContributionReviewCenter } from "@account/admin/components/ContributionReviewCenter";
import { redirect } from "next/navigation";
import {
	AdminPermission,
	hasPermission,
} from "@community/lib-shared/auth/permissions";

export default async function ContributionReviewPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	if (!hasPermission(session.user, AdminPermission.REVIEW_CONTRIBUTIONS)) {
		return redirect("/");
	}

	return <ContributionReviewCenter />;
}
