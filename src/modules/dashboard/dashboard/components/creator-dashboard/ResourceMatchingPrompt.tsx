import { Button } from "@/components/ui/button";
import { useProfileQuery } from "@/lib/api/api-hooks";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ResourceMatchingPrompt() {
	const { user, loaded: sessionLoaded } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();

	if (!sessionLoaded || !user || isLoading) {
		return null;
	}

	const hasResourceInfo =
		userProfile?.whatICanOffer || userProfile?.whatIAmLookingFor;
	const hasSkills = userProfile?.skills && userProfile?.skills.length > 0;

	if (hasResourceInfo && hasSkills) {
		return null;
	}

	return (
		<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 sm:p-4 shadow-sm">
			<div className="flex items-center gap-2 sm:gap-3">
				<div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
					<Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-blue-900 text-sm sm:text-base">
						完善资源匹配信息
					</h3>
					<p className="text-xs sm:text-sm text-blue-700">
						填写你的技能专长和需求，让其他成员更容易找到你
					</p>
				</div>
				<Button
					size="sm"
					className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
					asChild
				>
					<Link href="/app/profile#resource-matching">
						立即填写
						<ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
