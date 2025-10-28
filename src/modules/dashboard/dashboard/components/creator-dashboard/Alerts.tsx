import { AlertCircle, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileQuery } from "@/lib/api/api-hooks";
import { validateCoreProfile } from "@/lib/utils/profile-validation";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { LocaleLink } from "@i18n/routing";
import Link from "next/link";
import { useMemo } from "react";

interface AlertProps {
	type: "new-user" | "profile-incomplete";
	children: React.ReactNode;
}

function Alert({ type, children }: AlertProps) {
	const baseClasses = "rounded-xl p-4 shadow-sm border";
	const typeClasses = {
		"new-user":
			"bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
		"profile-incomplete":
			"bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
	};

	return (
		<div className={`${baseClasses} ${typeClasses[type]}`}>{children}</div>
	);
}

export function NewUserAlert() {
	const { user } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();
	const t = (key: string) => {
		const translations: Record<string, string> = {
			"dashboard.newUser.welcome": "欢迎加入 HackathonWeekly！",
			"dashboard.newUser.description":
				"开始你的黑客松之旅，与志同道合的伙伴一起创造精彩项目。",
			"dashboard.newUser.completeProfile": "完善资料",
		};
		return translations[key] || key;
	};

	if (!user) return null;

	const isNewUser =
		new Date(user.createdAt || Date.now()).getTime() >
		Date.now() - 7 * 24 * 60 * 60 * 1000;

	if (!isNewUser) return null;

	return (
		<Alert type="new-user">
			<div className="flex items-center gap-2 sm:gap-3">
				<div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-blue-900 text-sm sm:text-base">
						{t("dashboard.newUser.welcome")}
					</h3>
					<p className="text-xs sm:text-sm text-blue-700">
						{t("dashboard.newUser.description")}
					</p>
				</div>
				<div className="flex gap-1 sm:gap-2">
					<Button
						size="sm"
						className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
						asChild
					>
						<Link href="/app/profile">
							{t("dashboard.newUser.completeProfile")}
						</Link>
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
						asChild
					>
						<LocaleLink href="/docs">了解社区</LocaleLink>
					</Button>
				</div>
			</div>
		</Alert>
	);
}

export function ProfileIncompleteAlert() {
	const { user } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();

	const profileValidation = useMemo(() => {
		if (!userProfile) return null;
		return validateCoreProfile({
			name: userProfile.name,
			phoneNumber: userProfile.phoneNumber,
			email: userProfile.email,
			bio: userProfile.bio,
			userRoleString: userProfile.userRoleString,
			currentWorkOn: userProfile.currentWorkOn,
			lifeStatus: userProfile.lifeStatus,
			wechatId: userProfile.wechatId,
			skills: userProfile.skills,
			whatICanOffer: userProfile.whatICanOffer,
			whatIAmLookingFor: userProfile.whatIAmLookingFor,
		});
	}, [userProfile]);

	const shouldShowProfileNotice =
		profileValidation && profileValidation.missingCount > 0;

	if (!user || isLoading || !shouldShowProfileNotice) return null;

	return (
		<Alert type="profile-incomplete">
			<div className="flex items-center gap-2 sm:gap-3">
				<div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-yellow-900 text-sm sm:text-base">
						还有 {profileValidation.missingCount} 项资料未完善
					</h3>
					<p className="text-xs sm:text-sm text-yellow-700">
						完善后获得更多曝光机会
					</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					className="flex-shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
					asChild
				>
					<Link href="/app/profile">
						立即完善
						<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
					</Link>
				</Button>
			</div>
		</Alert>
	);
}
