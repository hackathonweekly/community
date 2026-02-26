import { db } from "@community/lib-server/database/prisma/client";
import { getInvitationMissingFieldLabels } from "@/features/profile/invitation-requirements";
import { getBaseUrl } from "@community/lib-shared/utils";
import { getInvitation, getSession } from "@shared/auth/lib/server";
import { InvitationProfileCompletionForm } from "@account/organizations/components/InvitationProfileCompletionForm";
import { redirect } from "next/navigation";
import { withQuery } from "ufo";

function buildInvitationPath(invitationId: string) {
	return `/orgs/organization-invitation/${invitationId}`;
}

export default async function InvitationCompleteProfilePage({
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
					我们无法找到该邀请，可能是链接有误或邀请已被撤回。
				</p>
			</div>
		);
	}

	const session = await getSession();

	if (!session) {
		return redirect(
			withQuery("/auth/login", {
				invitationId,
				redirectTo: `${buildInvitationPath(invitationId)}/complete-profile`,
			}),
		);
	}

	const viewerId = session.user.id;

	if (invitation.status !== "pending") {
		return redirect(buildInvitationPath(invitationId));
	}

	if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
		return redirect(buildInvitationPath(invitationId));
	}

	if (invitation.targetUserId && invitation.targetUserId !== viewerId) {
		return (
			<div className="mx-auto max-w-lg py-12">
				<h1 className="text-2xl font-semibold">无法完善资料</h1>
				<p className="mt-4 text-muted-foreground">
					该邀请仅面向指定成员，请使用收到邀请的账号登录。
				</p>
			</div>
		);
	}

	const existingMembership = await db.member.findUnique({
		where: {
			organizationId_userId: {
				organizationId: invitation.organizationId,
				userId: viewerId,
			},
		},
	});

	if (existingMembership) {
		return redirect(`/orgs/${invitation.organization.slug}`);
	}

	const user = await db.user.findUnique({
		where: { id: viewerId },
		select: {
			email: true,
			phoneNumber: true,
			userRoleString: true,
			bio: true,
			currentWorkOn: true,
			lifeStatus: true,
			wechatId: true,
		},
	});

	if (!user) {
		return redirect(buildInvitationPath(invitationId));
	}

	const missingFields = getInvitationMissingFieldLabels(user);

	const defaultValues = {
		email: user.email ?? "",
		phoneNumber: user.phoneNumber ?? "",
		userRoleString: user.userRoleString ?? "",
		bio: user.bio ?? "",
		currentWorkOn: user.currentWorkOn ?? "",
		lifeStatus: user.lifeStatus ?? "",
		wechatId: user.wechatId ?? "",
	};

	const shareUrl = `${getBaseUrl()}${buildInvitationPath(invitationId)}`;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
			<InvitationProfileCompletionForm
				invitationId={invitationId}
				organizationName={invitation.organization.name}
				organizationSlug={invitation.organization.slug}
				organizationLogo={invitation.organization.logo || undefined}
				defaultValues={defaultValues}
				initialMissingFields={missingFields}
				invitationPath={buildInvitationPath(invitationId)}
				shareUrl={shareUrl}
				expiresAt={invitation.expiresAt.toISOString()}
			/>
		</div>
	);
}
