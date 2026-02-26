import type { ProfileUser } from "@/modules/public/shared/components/UserSlideDeckUtils";
import { db } from "@community/lib-server/database";
import { RESERVED_USERNAMES } from "@community/lib-shared/utils";
import { getSession } from "@shared/auth/lib/server";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/modules/public/profile/components/ProfileHeader";
import { ProjectsSection } from "@/modules/public/profile/components/ProjectsSection";
import { OrganizationsSection } from "@/modules/public/profile/components/OrganizationsSection";
import { AchievementsSection } from "@/modules/public/profile/components/AchievementsSection";
import type { UserProfile } from "@/modules/public/profile/types";

export const dynamicParams = true;
export const revalidate = 3600;

interface PublicProfilePageProps {
	params: Promise<{
		username: string;
	}>;
}

async function getUserProfile(
	username: string,
	currentUserId?: string,
): Promise<UserProfile | null> {
	if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
		return null;
	}

	const [user, projects, members, userBadges, certificates] =
		await Promise.all([
			db.user.findFirst({
				where: {
					username: { equals: username, mode: "insensitive" },
					profilePublic: true,
				},
				select: {
					id: true,
					name: true,
					email: true,
					username: true,
					image: true,
					bio: true,
					region: true,
					phoneNumber: true,
					gender: true,
					userRoleString: true,
					currentWorkOn: true,
					skills: true,
					whatICanOffer: true,
					whatIAmLookingFor: true,
					lifeStatus: true,
					lastProfileUpdate: true,
					githubUrl: true,
					twitterUrl: true,
					websiteUrl: true,
					wechatId: true,
					wechatQrCode: true,
					profilePublic: true,
					showEmail: true,
					showWechat: true,
					cpValue: true,
					joinedAt: true,
					profileViews: true,
					membershipLevel: true,
				},
			}),
			db.project.findMany({
				where: {
					user: {
						username: { equals: username, mode: "insensitive" },
					},
					isComplete: true,
				},
				select: {
					id: true,
					title: true,
					description: true,
					featured: true,
					order: true,
					createdAt: true,
					viewCount: true,
				},
				orderBy: [
					{ featured: "desc" },
					{ order: "asc" },
					{ createdAt: "desc" },
				],
				take: 12,
			}),
			db.member.findMany({
				where: {
					user: {
						username: { equals: username, mode: "insensitive" },
					},
				},
				select: {
					id: true,
					role: true,
					organization: {
						select: {
							id: true,
							name: true,
							slug: true,
							logo: true,
						},
					},
				},
				take: 10,
			}),
			db.userBadge.findMany({
				where: {
					user: {
						username: { equals: username, mode: "insensitive" },
					},
					OR: [
						{ expiresAt: null },
						{ expiresAt: { gt: new Date() } },
					],
				},
				select: {
					id: true,
					awardedAt: true,
					badge: {
						select: {
							id: true,
							name: true,
							description: true,
							rarity: true,
							iconUrl: true,
						},
					},
				},
				orderBy: [{ badge: { rarity: "desc" } }, { awardedAt: "desc" }],
				take: 10,
			}),
			db.projectAward.findMany({
				where: {
					project: {
						user: {
							username: { equals: username, mode: "insensitive" },
						},
					},
				},
				select: {
					id: true,
					awardedAt: true,
					project: {
						select: { id: true, title: true, description: true },
					},
					award: {
						select: {
							id: true,
							name: true,
							organization: {
								select: { id: true, name: true, logo: true },
							},
						},
					},
					event: {
						select: { id: true, title: true },
					},
				},
				orderBy: { awardedAt: "desc" },
				take: 10,
			}),
		]);

	if (!user) return null;

	// Parallel follow/like checks
	const [actualFollowStatus, reverseFollowStatus, actualLikeStatus] =
		currentUserId
			? await Promise.all([
					db.userFollow.findUnique({
						where: {
							followerId_followingId: {
								followerId: currentUserId,
								followingId: user.id,
							},
						},
					}),
					db.userFollow.findUnique({
						where: {
							followerId_followingId: {
								followerId: user.id,
								followingId: currentUserId,
							},
						},
					}),
					db.userLike.findUnique({
						where: {
							userId_likedUserId: {
								userId: currentUserId,
								likedUserId: user.id,
							},
						},
					}),
				])
			: [null, null, null];

	const isFollowed = !!actualFollowStatus;
	const isFollowedByViewer = !!reverseFollowStatus;
	const isMutualFollow = isFollowed && isFollowedByViewer;
	const isSelf = currentUserId === user.id;
	const canViewContacts = isSelf || isMutualFollow;

	const rawEmail = user.email;
	const rawPhoneNumber = user.phoneNumber;
	const rawWechatId = user.wechatId;
	const rawWechatQrCode = user.wechatQrCode;
	const hasWechatInfo = Boolean(rawWechatId || rawWechatQrCode);
	const canViewWechat = canViewContacts && hasWechatInfo;

	const contactAvailability = {
		email: Boolean(rawEmail),
		phone: Boolean(rawPhoneNumber),
		wechat: hasWechatInfo,
	};

	// Fire-and-forget view counter
	db.user
		.update({
			where: { id: user.id },
			data: { profileViews: { increment: 1 } },
		})
		.catch(() => {});

	return {
		...user,
		email: canViewContacts ? rawEmail : null,
		phoneNumber: canViewContacts ? rawPhoneNumber : null,
		wechatId: canViewWechat ? rawWechatId : null,
		wechatQrCode: canViewWechat ? rawWechatQrCode : null,
		canViewContacts,
		contactAvailability,
		projects,
		members,
		userBadges,
		certificates,
		isFollowed,
		isMutualFollow,
		isLiked: !!actualLikeStatus,
	};
}

export async function generateMetadata({
	params,
}: PublicProfilePageProps): Promise<Metadata> {
	const { username } = await params;
	const locale = await getLocale();
	const user = await getUserProfile(username);

	if (!user) {
		return {
			title: "Profile Not Found",
			description: "The requested profile could not be found.",
		};
	}

	const isZh = locale?.startsWith("zh");
	const defaultTitle = `${user.name} - ${user.userRoleString || "社区成员"} | Hackathon Weekly`;
	const title = isZh ? "查看我的社区名片" : defaultTitle;
	const description =
		user.bio || `${user.name}'s profile on Hackathon Weekly Community`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "profile",
			url: `https://hackathonweekly.com/u/${user.username}`,
		},
		twitter: {
			card: "summary",
			title,
			description,
		},
	};
}

export default async function PublicProfilePage({
	params,
}: PublicProfilePageProps) {
	const t = await getTranslations();
	const { username } = await params;

	const session = await getSession();
	const currentUserId = session?.user?.id;

	const user = await getUserProfile(username, currentUserId);

	if (!user) {
		notFound();
	}

	const skills = user.skills || [];
	const normalizedSkills = Array.isArray(skills)
		? skills.filter(
				(skill): skill is string =>
					typeof skill === "string" && skill.trim().length > 0,
			)
		: [];

	const profileUser: ProfileUser = {
		id: user.id,
		name: user.name || "",
		username: user.username || "",
		image: user.image,
		userRoleString: user.userRoleString,
		currentWorkOn: user.currentWorkOn,
		bio: user.bio,
		region: user.region,
		skills: normalizedSkills,
		whatICanOffer: user.whatICanOffer,
		whatIAmLookingFor: user.whatIAmLookingFor,
		lifeStatus: user.lifeStatus,
		cpValue: user.cpValue,
		profileViews: user.profileViews,
		joinedAt: user.joinedAt,
		showEmail: user.showEmail,
		email: user.email,
		showWechat: user.showWechat,
		wechatId: user.wechatId,
		wechatQrCode: user.wechatQrCode,
		githubUrl: user.githubUrl,
		twitterUrl: user.twitterUrl,
		websiteUrl: user.websiteUrl,
		projects: user.projects,
		isFollowed: user.isFollowed,
		isMutualFollow: user.isMutualFollow,
		wechatInfo:
			user.isMutualFollow && user.showWechat
				? {
						wechatId: user.wechatId,
						wechatQrCode: user.wechatQrCode,
					}
				: null,
	};

	const translations = {
		editProfile: t("userProfile.editProfile"),
		collaborationInfo: t("userProfile.collaborationInfo"),
		whatICanOffer: t("userProfile.whatICanOffer"),
		whatIAmLookingFor: t("userProfile.whatIAmLookingFor"),
	};

	return (
		<div className="max-w-6xl mx-auto px-4 lg:px-8 py-5 lg:py-6 pb-20 lg:pb-16">
			<div className="relative space-y-6">
				<ProfileHeader
					user={user}
					currentUserId={currentUserId}
					translations={translations}
					profileUser={profileUser}
				/>

				<ProjectsSection
					user={user}
					currentUserId={currentUserId}
					t={t}
				/>

				<OrganizationsSection
					user={user}
					currentUserId={currentUserId}
					t={t}
				/>

				<AchievementsSection
					user={user}
					currentUserId={currentUserId}
					t={t}
				/>
			</div>
		</div>
	);
}
