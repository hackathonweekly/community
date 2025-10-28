import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfileQuery } from "@/lib/api/api-hooks";
import { getLifeStatusLabel } from "@/lib/utils/life-status";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { UserLevelBadges } from "@dashboard/level/components/LevelBadge";
import { useTranslations } from "next-intl";
import { Edit3, Crown, Star, Zap } from "lucide-react";
import Link from "next/link";

// 获取生命状态翻译
function getLifeStatusTranslation(status: string, t: any) {
	if (!status) return "";

	const translationKey = `lifeStatus.${status.toLowerCase()}`;
	const translated = t(translationKey);
	if (translated !== translationKey) return translated;

	const label = getLifeStatusLabel(status);
	return label || status;
}

// 获取等级图标
function getLevelIcon(level: string | null) {
	switch (level) {
		case "C2":
			return <Crown className="h-4 w-4 text-yellow-600" />;
		case "C1":
			return <Star className="h-4 w-4 text-blue-600" />;
		case "B2":
		case "B1":
			return <Zap className="h-4 w-4 text-purple-600" />;
		default:
			return null;
	}
}

export function UserInfo() {
	const { user, loaded: sessionLoaded } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();
	const t = useTranslations();

	if (!sessionLoaded || !user) {
		return <UserInfoSkeleton />;
	}

	const displayUsername = userProfile?.username || user.username;
	const creatorLevel = userProfile?.creatorLevel;
	const levelIcon = getLevelIcon(creatorLevel);

	return (
		<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 p-3 sm:p-4">
			{/* 第一行：头像 + 用户名 + 状态 + 等级 + 编辑 */}
			<div className="flex items-center gap-2 sm:gap-3">
				<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
					<AvatarImage
						src={user.image || ""}
						alt={user.name || "User"}
					/>
					<AvatarFallback className="bg-blue-100 text-blue-700 text-sm sm:text-lg font-semibold">
						{(user.name || "User")[0]?.toUpperCase() || "U"}
					</AvatarFallback>
				</Avatar>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1 sm:gap-2 flex-wrap">
						<h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
							{user.name || "用户"}
						</h1>
						{userProfile?.currentWorkOn && (
							<span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
								🚀 {userProfile.currentWorkOn}
							</span>
						)}
						{levelIcon && (
							<div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
								{levelIcon}
								<span>{creatorLevel}</span>
							</div>
						)}
					</div>
				</div>

				<Link
					href="/app/profile"
					className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors"
					title="编辑资料"
				>
					<Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
				</Link>
			</div>

			{/* 第二行：详细信息 */}
			<div className="mt-2 text-xs sm:text-sm text-gray-600 flex items-center gap-1 sm:gap-2 flex-wrap">
				<span>@{displayUsername || "设置中"}</span>
				{userProfile?.skills && userProfile.skills.length > 0 && (
					<>
						<span>•</span>
						<span>{userProfile.skills[0]}</span>
					</>
				)}
				{userProfile?.whatIAmLookingFor && (
					<>
						<span>•</span>
						<span>{userProfile.whatIAmLookingFor}</span>
					</>
				)}
			</div>

			{/* 第三行：等级徽章 */}
			<div className="mt-3 pt-3 border-t border-blue-100">
				{isLoading ? (
					<div className="h-6 w-20 bg-gray-200 animate-pulse rounded-lg" />
				) : (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-500 font-medium">
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

function UserInfoSkeleton() {
	return (
		<div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-gray-200 p-3 sm:p-4">
			{/* 第一行骨架 */}
			<div className="flex items-center gap-2 sm:gap-3">
				<div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 animate-pulse rounded-full flex-shrink-0" />
				<div className="flex-1 space-y-2">
					<div className="h-4 sm:h-5 bg-gray-200 animate-pulse rounded w-1/2" />
					<div className="h-3 bg-gray-200 animate-pulse rounded w-2/3" />
				</div>
				<div className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 animate-pulse rounded-full" />
			</div>

			{/* 第二行骨架 */}
			<div className="mt-2 h-3 bg-gray-200 animate-pulse rounded w-3/4" />

			{/* 第三行骨架 */}
			<div className="mt-3 pt-3 border-t border-blue-100">
				<div className="flex items-center justify-between">
					<div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
					<div className="h-5 w-16 bg-gray-200 animate-pulse rounded-lg" />
				</div>
			</div>
		</div>
	);
}
