import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "../types";
import { formatDate } from "../types";

interface StatsSectionProps {
	user: UserProfile;
	t: any;
}

export function StatsSection({ user, t }: StatsSectionProps) {
	const skills = user.skills || [];

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>{t("userProfile.statistics")}</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Mobile view - main stats only */}
				<div className="grid grid-cols-2 sm:hidden gap-3">
					<div className="text-center p-3 bg-muted/20 rounded-lg">
						<div className="text-xl font-bold text-primary mb-1">
							{user.profileViews}
						</div>
						<div className="text-xs text-muted-foreground">
							浏览量
						</div>
					</div>
					<div className="text-center p-3 bg-muted/20 rounded-lg">
						<div className="text-xl font-bold text-primary mb-1">
							{user.projects.length}
						</div>
						<div className="text-xs text-muted-foreground">
							作品数
						</div>
					</div>
				</div>

				{/* Desktop view - complete stats */}
				<div className="hidden sm:grid grid-cols-4 gap-4">
					<div className="text-center p-2">
						<div className="text-2xl font-bold text-primary">
							{user.profileViews}
						</div>
						<div className="text-sm text-muted-foreground">
							{t("userProfile.profileViews")}
						</div>
					</div>
					<div className="text-center p-2">
						<div className="text-2xl font-bold text-primary">
							{skills.length}
						</div>
						<div className="text-sm text-muted-foreground">
							{t("userProfile.skills")}
						</div>
					</div>
					<div className="text-center p-2">
						<div className="text-2xl font-bold text-primary">
							{user.projects.length}
						</div>
						<div className="text-sm text-muted-foreground">
							{t("userProfile.projects")}
						</div>
					</div>
					<div className="text-center p-2">
						<div className="text-lg font-bold text-primary">
							{user.joinedAt ? formatDate(user.joinedAt) : "N/A"}
						</div>
						<div className="text-sm text-muted-foreground">
							{t("userProfile.memberSince")}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
