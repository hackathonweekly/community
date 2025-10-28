import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileQuery } from "@/lib/api/api-hooks";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { useTranslations } from "next-intl";

// 获取生命状态翻译
function getLifeStatusTranslation(status: string, t: any) {
	if (!status) return "";

	const translationKey = `lifeStatus.${status.toLowerCase()}`;
	const translated = t(translationKey);
	if (translated !== translationKey) return translated;

	const label = getLifeStatusLabel(status);
	return label || status;
}

export function UserOverview() {
	const { user, loaded: sessionLoaded } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();
	const t = useTranslations();

	if (!sessionLoaded) {
		return <UserOverviewSkeleton />;
	}

	if (!user) {
		return <UserOverviewSkeleton />;
	}

	const displayUsername = userProfile?.username || user.username;

	return (
		<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 p-4 sm:p-6">
			{/* 用户基本信息 */}
			<div className="flex items-start gap-4">
				<Avatar className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0">
					<AvatarImage
						src={user.image || ""}
						alt={user.name || "User"}
					/>
					<AvatarFallback className="bg-blue-100 text-blue-700 text-xl sm:text-2xl font-semibold">
						{(user.name || "User")[0]?.toUpperCase() || "U"}
					</AvatarFallback>
				</Avatar>

				<div className="flex-1 min-w-0">
					<h1 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
						{user.name || "用户"}
					</h1>

					{/* 用户名和状态信息 */}
					<div className="mt-2 space-y-2">
						<div className="flex flex-wrap items-center gap-2 sm:gap-3">
							<span className="text-sm text-gray-600">
								@{displayUsername || "设置中"}
							</span>
							{userProfile?.currentWorkOn && (
								<span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-purple-100 text-purple-800 text-xs sm:text-sm font-medium">
									🚀 {userProfile.currentWorkOn}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* 用户等级徽章 - 独立一行显示 */}
			<div className="mt-4 pt-4 border-t border-blue-100">
				{isLoading ? (
					<div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
				) : (
					<div className="flex items-center justify-between">
						<span className="text-xs sm:text-sm text-gray-500 font-medium">
							用户等级
						</span>
						<UserLevelBadges
							user={{
								membershipLevel:
									userProfile?.membershipLevel ?? null,
								creatorLevel: userProfile?.creatorLevel ?? null,
								mentorLevel: userProfile?.mentorLevel ?? null,
								contributorLevel:
									userProfile?.contributorLevel ?? null,
								createdAt: user.createdAt,
							}}
							size="sm"
							showTooltip={false}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function UserOverviewSkeleton() {
	return (
		<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 p-4 sm:p-6">
			{/* 用户基本信息骨架 */}
			<div className="flex items-start gap-4">
				<div className="h-14 w-14 sm:h-16 sm:w-16 bg-gray-200 animate-pulse rounded-full flex-shrink-0" />
				<div className="flex-1 min-w-0 space-y-2">
					<div className="h-6 sm:h-7 bg-gray-200 animate-pulse rounded w-1/2" />
					<div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
					<div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
				</div>
			</div>

			{/* 用户等级徽章骨架 */}
			<div className="mt-4 pt-4 border-t border-blue-100">
				<div className="flex items-center justify-between">
					<div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
					<div className="h-6 w-20 bg-gray-200 animate-pulse rounded-lg" />
				</div>
			</div>
		</div>
	);
}
