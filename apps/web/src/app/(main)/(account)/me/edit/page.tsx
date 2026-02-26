import { db } from "@community/lib-server/database";
import { getSession } from "@shared/auth/lib/server";
import { ProfileEditForm } from "@account/profile/components/ProfileEditForm";
import { UserAvatarForm } from "@account/settings/components/UserAvatarForm";
import { PageHeader } from "@shared/components/PageHeader";
import { SettingsList } from "@shared/components/SettingsList";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("profile.title"),
	};
}

export default async function ProfilePage({
	searchParams,
}: {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
		invitationId?: string;
	}>;
}) {
	const params = await searchParams;
	const rawInvitationId = params.invitationId;
	const invitationId = Array.isArray(rawInvitationId)
		? rawInvitationId[0]
		: rawInvitationId;
	const normalizedInvitationId =
		typeof invitationId === "string" && invitationId.trim().length > 0
			? invitationId.trim()
			: undefined;
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const t = await getTranslations();

	// Fetch user profile data directly from database
	const user = await db.user.findUnique({
		where: {
			id: session.user.id,
		},
		select: {
			id: true,
			name: true,
			email: true,
			username: true,
			bio: true,
			region: true, // 地区字段
			phoneNumber: true,
			gender: true,
			userRoleString: true, // 用户角色（字符串类型）
			currentWorkOn: true, // 当前在做
			githubUrl: true,
			twitterUrl: true,
			websiteUrl: true,
			wechatId: true,
			wechatQrCode: true, // 微信二维码
			cpValue: true,
			joinedAt: true,
			profileViews: true,
			profilePublic: true,
			showEmail: true,
			showWechat: true,
			skills: true, // 统一技能字段
			// 简化的资源匹配字段
			whatICanOffer: true,
			whatIAmLookingFor: true,
			lifeStatus: true, // 当前状态
		},
	});

	if (!user) {
		throw new Error("User not found");
	}

	const viewProfileLink = user?.username && (
		<Link
			href={`/u/${user.username}`}
			target="_blank"
			className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-4 text-xs font-bold text-black transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
		>
			<ExternalLink className="h-3.5 w-3.5" />
			个人主页
		</Link>
	);

	const returnToInvitationLink = normalizedInvitationId ? (
		<Link
			href={`/orgs/organization-invitation/${normalizedInvitationId}`}
			className="inline-flex h-8 items-center justify-center rounded-full bg-black px-4 text-xs font-bold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-gray-200"
		>
			返回加入流程
		</Link>
	) : null;

	const headerAction =
		returnToInvitationLink || viewProfileLink ? (
			<div className="flex flex-wrap items-center gap-2">
				{returnToInvitationLink}
				{viewProfileLink}
			</div>
		) : undefined;

	return (
		<>
			<MobilePageHeader title="个人资料编辑" />

			<div className="mx-auto max-w-6xl px-4 py-4 lg:px-8 lg:py-6">
				<SettingsList className="gap-4">
					<UserAvatarForm />
					<ProfileEditForm user={user} />
				</SettingsList>
			</div>
		</>
	);
}
