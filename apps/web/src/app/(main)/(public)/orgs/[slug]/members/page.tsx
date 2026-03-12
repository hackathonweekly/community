import { redirect } from "next/navigation";

export default async function OrganizationPublicMembersPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	redirect(`/orgs/${slug}?tab=members`);
}
