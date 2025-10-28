import type { ProfileUser } from "@/modules/public/shared/components/UserSlideDeckUtils";
import { db } from "@/lib/database";
import { computeRoleAssignmentStatus } from "@/lib/database/prisma/queries/functional-roles";
import { RESERVED_USERNAMES } from "@/lib/utils";
import { getSession } from "@dashboard/auth/lib/server";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProfileHeader } from "./components/ProfileHeader";
import { ResourceMatchingSection } from "./components/ResourceMatchingSection";
// import { SharedEventsSection } from "./components/SharedEventsSection";
import { ProjectsSection } from "./components/ProjectsSection";
import { StatsSection } from "./components/StatsSection";
import { OrganizationsSection } from "./components/OrganizationsSection";
import { EventsSection } from "./components/EventsSection";
import { CertificatesSection } from "./components/CertificatesSection";
import { BadgesSection } from "./components/BadgesSection";
import { FunctionalRolesSection } from "./components/FunctionalRolesSection";
import type { UserFunctionalRoleAssignment, UserProfile } from "./types";

// 用户个人页面配置
// - dynamicParams: 允许运行时生成未预渲染的用户页面
// - revalidate: 1小时后重新验证，平衡实时性和性能
export const dynamicParams = true;
export const revalidate = 3600; // 1小时

interface PublicProfilePageProps {
	params: Promise<{
		username: string;
		locale: string;
	}>;
}

async function getUserProfile(
	username: string,
	currentUserId?: string,
): Promise<UserProfile | null> {
	if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
		return null;
	}

	const [
		user,
		projects,
		members,
		events,
		userBadges,
		certificates,
		roleAssignments,
		// 移除 sharedEvents - 查询过于复杂，功能使用频率低
	] = await Promise.all([
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
				creatorLevel: true,
				mentorLevel: true,
				contributorLevel: true,
			},
		}),
		db.project.findMany({
			where: {
				user: { username: { equals: username, mode: "insensitive" } },
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
				// 只选择必要字段，减少数据传输
			},
			orderBy: [
				{ featured: "desc" },
				{ order: "asc" },
				{ createdAt: "desc" },
			],
			take: 12, // 限制数量
		}),
		db.member.findMany({
			where: {
				user: { username: { equals: username, mode: "insensitive" } },
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
			take: 10, // 限制数量
		}),
		db.event.findMany({
			where: {
				organizer: {
					username: { equals: username, mode: "insensitive" },
				},
				status: { in: ["DRAFT", "PUBLISHED", "COMPLETED"] },
			},
			select: {
				id: true,
				title: true,
				richContent: true,
				startTime: true,
				endTime: true,
				address: true,
				status: true,
				type: true,
				tags: true,
				createdAt: true,
				_count: { select: { registrations: true } },
			},
			orderBy: { startTime: "desc" },
			take: 10,
		}),
		db.userBadge.findMany({
			where: {
				user: { username: { equals: username, mode: "insensitive" } },
				OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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
			take: 10, // 限制数量
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
			take: 10, // 限制数量
		}),
		db.roleAssignment.findMany({
			where: {
				user: {
					username: { equals: username, mode: "insensitive" },
				},
			},
			select: {
				id: true,
				startDate: true,
				endDate: true,
				isActive: true,
				functionalRole: {
					select: {
						id: true,
						name: true,
						description: true,
						applicableScope: true,
						organizationId: true,
					},
				},
				organization: {
					select: { id: true, name: true, slug: true },
				},
			},
			orderBy: [{ startDate: "desc" }],
			take: 10, // 限制数量
		}),
		// 移除了复杂的 sharedEvents 查询
		// 原查询涉及多层嵌套关系，性能影响大，使用频率低
	]);

	if (!user) return null;

	const normalizedFunctionalRoles: UserFunctionalRoleAssignment[] =
		roleAssignments.map((assignment) => {
			const status = computeRoleAssignmentStatus(assignment);
			const roleType: "system" | "custom" = assignment.functionalRole
				.organizationId
				? "custom"
				: "system";
			return {
				id: assignment.id,
				roleType,
				status,
				startDate: assignment.startDate.toISOString(),
				endDate: assignment.endDate
					? assignment.endDate.toISOString()
					: null,
				isActive: assignment.isActive,
				functionalRole: {
					id: assignment.functionalRole.id,
					name: assignment.functionalRole.name,
					description: assignment.functionalRole.description,
					applicableScope: assignment.functionalRole.applicableScope,
					organizationId: assignment.functionalRole.organizationId,
				},
				organization: assignment.organization
					? {
							id: assignment.organization.id,
							name: assignment.organization.name,
							slug: assignment.organization.slug,
						}
					: null,
			};
		});

	const [actualFollowStatus, reverseFollowStatus] = currentUserId
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
			])
		: [null, null];

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

	const actualLikeStatus = currentUserId
		? await db.userLike.findUnique({
				where: {
					userId_likedUserId: {
						userId: currentUserId,
						likedUserId: user.id,
					},
				},
			})
		: null;

	// Get shared events between current user and profile user
	// const sharedEvents = currentUserId && currentUserId !== user.id
	// 	? await db.event.findMany({
	// 			where: {
	// 				registrations: {
	// 					every: {
	// 						status: "APPROVED",
	// 					},
	// 					some: {
	// 						userId: currentUserId,
	// 					},
	// 					some: {
	// 						userId: user.id,
	// 					},
	// 				},
	// 			},
	// 			select: {
	// 				id: true,
	// 				title: true,
	// 				status: true,
	// 				type: true,
	// 				shortDescription: true,
	// 				startTime: true,
	// 				address: true,
	// 				tags: true,
	// 				_count: {
	// 					select: {
	// 						registrations: {
	// 							where: {
	// 								status: {
	// 									in: ["APPROVED", "PENDING"],
	// 								},
	// 							},
	// 						},
	// 					},
	// 				},
	// 			},
	// 			orderBy: {
	// 				startTime: "desc",
	// 			},
	// 			take: 10, // Limit to 10 most recent shared events
	// 		})
	// 	: [];

	// 暂时禁用 sharedEvents 功能
	const sharedEvents: any[] = [];

	await db.user.update({
		where: { id: user.id },
		data: { profileViews: { increment: 1 } },
	});

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
		events,
		userBadges,
		certificates,
		functionalRoles: normalizedFunctionalRoles,
		isFollowed,
		isMutualFollow,
		isLiked: !!actualLikeStatus,
		sharedEvents,
	};
}

export async function generateMetadata({
	params,
}: PublicProfilePageProps): Promise<Metadata> {
	const { username, locale } = await params;
	const user = await getUserProfile(username);

	if (!user) {
		return {
			title: "Profile Not Found",
			description: "The requested profile could not be found.",
		};
	}

	const isZh = locale?.startsWith("zh");
	const localizedPath = locale ? `/${locale}` : "";
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
			url: `https://hackathonweekly.com${localizedPath}/u/${user.username}`,
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

	// Create ProfileUser object for ProfileSlideModeLauncher
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

	// Pre-resolve all translations used by client components
	const translations = {
		editProfile: t("userProfile.editProfile"),
		eventsCreated: t("userProfile.eventsCreated"),
		participants: t("userProfile.participants"),
		collaborationInfo: t("userProfile.collaborationInfo"),
		whatICanOffer: t("userProfile.whatICanOffer"),
		whatIAmLookingFor: t("userProfile.whatIAmLookingFor"),
		ourConnection: t("userProfile.ourConnection"),
		sharedEvents: t("userProfile.sharedEvents"),
		badgesSection: t("userProfile.badgesSection"),
		badgeReason: t("userProfile.badgeReason"),
		certificatesSection: t("userProfile.certificatesSection"),
	};

	const userProfileT = (key: string) => {
		return t(`userProfile.${key}`);
	};

	return (
		<div className="container max-w-4xl pt-8 pb-24 sm:pb-16 md:pb-8 mx-auto">
			<div className="py-4 sm:py-8 px-4 relative">
				<ProfileHeader
					user={user}
					currentUserId={currentUserId}
					translations={translations}
					profileUser={profileUser}
				/>

				<ResourceMatchingSection
					user={user}
					userProfileT={userProfileT}
				/>

				{/* 暂时注释掉 SharedEventsSection 功能
				<SharedEventsSection
					user={user}
					currentUserId={currentUserId}
					userProfileT={userProfileT}
					t={t}
				/>
				*/}

				<ProjectsSection
					user={user}
					currentUserId={currentUserId}
					t={t}
				/>

				<StatsSection user={user} t={t} />

				<OrganizationsSection
					user={user}
					currentUserId={currentUserId}
					t={t}
				/>

				<FunctionalRolesSection assignments={user.functionalRoles} />

				<EventsSection
					user={user}
					currentUserId={currentUserId}
					userProfileT={userProfileT}
				/>

				<CertificatesSection
					user={user}
					currentUserId={currentUserId}
					userProfileT={userProfileT}
				/>

				<BadgesSection
					user={user}
					currentUserId={currentUserId}
					userProfileT={userProfileT}
				/>
			</div>
		</div>
	);
}
