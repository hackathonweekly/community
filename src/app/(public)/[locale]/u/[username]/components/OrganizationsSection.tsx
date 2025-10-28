import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { UserProfile } from "../types";
import { getImageUrl, getRoleDisplayName } from "../types";

interface OrganizationsSectionProps {
	user: UserProfile;
	currentUserId?: string;
	t: any;
}

export function OrganizationsSection({
	user,
	currentUserId,
	t,
}: OrganizationsSectionProps) {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>{t("userProfile.organizations")}</CardTitle>
			</CardHeader>
			<CardContent>
				{user.members.length > 0 ? (
					<div className="flex flex-wrap gap-3">
						{user.members.map((member: any) => (
							<Link
								key={member.id}
								href={`/zh/${member.organization.slug}`}
								className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
							>
								{member.organization.logo ? (
									<img
										src={
											getImageUrl(
												member.organization.logo,
											) || undefined
										}
										alt={member.organization.name}
										className="w-6 h-6 rounded-full"
									/>
								) : (
									<div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold">
										{member.organization.name
											.charAt(0)
											.toUpperCase()}
									</div>
								)}
								<span className="font-medium">
									{member.organization.name}
								</span>
								<Badge variant="secondary" className="text-xs">
									{getRoleDisplayName(member.role)}
								</Badge>
							</Link>
						))}
					</div>
				) : (
					<div className="text-center py-6 text-muted-foreground">
						<div className="mb-2">🏢</div>
						<p className="text-sm">
							{currentUserId === user.id
								? "你还没有加入任何组织"
								: "该用户还没有加入任何组织"}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
