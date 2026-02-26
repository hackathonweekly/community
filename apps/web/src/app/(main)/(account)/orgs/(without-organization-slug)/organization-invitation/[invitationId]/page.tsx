import { db } from "@community/lib-server/database/prisma/client";
import { OrganizationInvitationModal } from "@account/organizations/components/OrganizationInvitationModal";
import { getInvitation, getSession } from "@shared/auth/lib/server";
import { redirect } from "next/navigation";
import { withQuery } from "ufo";

export default async function OrganizationInvitationPage({
	params,
}: {
	params: Promise<{ invitationId: string }>;
}) {
	const { invitationId } = await params;

	const invitation = await getInvitation(invitationId);

	if (!invitation) {
		return (
			<div className="mx-auto max-w-lg py-12">
				<h1 className="text-2xl font-semibold">邀请已失效</h1>
				<p className="mt-4 text-muted-foreground">
					我们无法找到该组织邀请，可能是链接有误或邀请已被撤回。
				</p>
			</div>
		);
	}

	const session = await getSession();

	if (!session) {
		return redirect(
			withQuery("/auth/login", {
				invitationId,
				redirectTo: `/orgs/organization-invitation/${invitationId}`,
			}),
		);
	}

	const viewerId = session.user.id;
	const now = new Date();
	const isExpired = invitation.expiresAt.getTime() <= now.getTime();
	const isPending = invitation.status === "pending";
	const rawMetadata =
		invitation.metadata && typeof invitation.metadata === "object"
			? (invitation.metadata as Record<string, unknown>)
			: {};
	const linkType =
		typeof rawMetadata.linkType === "string"
			? (rawMetadata.linkType as string)
			: invitation.targetUserId
				? "in-app"
				: "link";
	const restrictToRecipient =
		linkType === "in-app" || linkType === "email+in-app";
	const isRecipient = restrictToRecipient
		? invitation.targetUserId
			? invitation.targetUserId === viewerId
			: true
		: true;

	const existingMembership = await db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId: invitation.organizationId,
				userId: viewerId,
			},
		},
	});

	let canRespond = isPending && !isExpired && isRecipient;
	let bannerMessage: string | undefined;

	if (existingMembership) {
		canRespond = false;
		bannerMessage = "您已经是该组织的成员，无需再次接受邀请。";
	} else if (!isPending) {
		canRespond = false;
		bannerMessage = "该邀请已被处理或撤回。";
	} else if (isExpired) {
		canRespond = false;
		bannerMessage = "该邀请链接已过期，请联系组织管理员重新发送。";
	} else if (!isRecipient && restrictToRecipient) {
		canRespond = false;
		bannerMessage = invitation.targetUser?.name
			? `该邀请仅面向 ${invitation.targetUser.name}，请确认您使用了正确的账号。`
			: "该邀请仅面向指定成员，您无法接受。";
	}

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
			<OrganizationInvitationModal
				invitationId={invitationId}
				organizationName={invitation.organization.name}
				organizationSlug={invitation.organization.slug}
				logoUrl={invitation.organization.logo || undefined}
				status={invitation.status}
				expiresAt={invitation.expiresAt.toISOString()}
				canRespond={canRespond}
				infoMessage={bannerMessage}
				targetUserName={invitation.targetUser?.name || undefined}
				targetUserEmail={invitation.targetUser?.email || undefined}
			/>
		</div>
	);
}
