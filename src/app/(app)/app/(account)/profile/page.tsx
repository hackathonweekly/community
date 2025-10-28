import { db } from "@/lib/database";
import { getSession } from "@dashboard/auth/lib/server";
import { ProfileEditForm } from "@dashboard/profile/components/ProfileEditForm";
import { UserAvatarForm } from "@dashboard/settings/components/UserAvatarForm";
import { PageHeader } from "@dashboard/shared/components/PageHeader";
import { SettingsList } from "@dashboard/shared/components/SettingsList";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

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
			href={`/zh/u/${user.username}`}
			target="_blank"
			className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
		>
			<ExternalLink className="h-4 w-4 mr-1" />
			个人主页
		</Link>
	);

	const returnToInvitationLink = normalizedInvitationId ? (
		<Link
			href={`/app/organization-invitation/${normalizedInvitationId}`}
			className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium h-9 px-3"
		>
			返回加入流程
		</Link>
	) : null;

	const headerAction =
		returnToInvitationLink || viewProfileLink ? (
			<div className="flex items-center gap-2">
				{returnToInvitationLink}
				{viewProfileLink}
			</div>
		) : undefined;

	return (
		<>
			<PageHeader
				title={t("profile.title")}
				subtitle={t("profile.subtitle")}
				action={headerAction}
			/>

			<div className="container max-w-6xl py-8">
				<SettingsList>
					<UserAvatarForm />
					<ProfileEditForm user={user} />
				</SettingsList>
			</div>
		</>
	);
}
