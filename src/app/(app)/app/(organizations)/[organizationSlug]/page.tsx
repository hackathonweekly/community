import { getActiveOrganization, getSession } from "@dashboard/auth/lib/server";
import { notFound, redirect } from "next/navigation";
import { isOrganizationAdmin } from "@/lib/auth/lib/helper";
import { db } from "@/lib/database";
import { OrganizationPageClient } from "./OrganizationPageClient";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	return {
		title: activeOrganization?.name,
	};
}

export default async function OrganizationPage({
	params,
}: { params: Promise<{ organizationSlug: string }> }) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const session = await getSession();
	if (!session?.user) {
		redirect("/auth/sign-in");
	}

	const userIsAdmin = isOrganizationAdmin(activeOrganization, session?.user);

	// 获取组织统计数据
	const [eventsCount, membersCount] = await Promise.all([
		db.event.count({ where: { organizationId: activeOrganization.id } }),
		db.member.count({ where: { organizationId: activeOrganization.id } }),
	]);

	return (
		<OrganizationPageClient
			activeOrganization={activeOrganization}
			userIsAdmin={userIsAdmin}
			eventsCount={eventsCount}
			membersCount={membersCount}
		/>
	);
}
