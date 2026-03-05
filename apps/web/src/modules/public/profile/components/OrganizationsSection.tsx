import { Building2 } from "lucide-react";
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
	const isSelf = currentUserId === user.id;

	// Non-self with no orgs: hide
	if (user.members.length === 0 && !isSelf) {
		return null;
	}

	return (
		<div>
			{/* Section divider */}
			<div className="flex items-center gap-3 mb-4">
				<h3 className="font-brand text-sm font-bold uppercase tracking-wide text-gray-400">
					{t("userProfile.organizations")}
				</h3>
				<div className="h-px bg-gray-100 flex-1" />
			</div>

			{user.members.length > 0 ? (
				<div className="flex flex-wrap gap-3">
					{user.members.map((member: any) => (
						<Link
							key={member.id}
							href={`/orgs/${member.organization.slug}`}
							className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
						>
							{member.organization.logo ? (
								<img
									src={
										getImageUrl(member.organization.logo) ||
										undefined
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
							<span className="font-brand text-sm font-bold">
								{member.organization.name}
							</span>
							<span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-gray-200">
								{getRoleDisplayName(member.role)}
							</span>
						</Link>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
						<Building2 className="w-6 h-6 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground">
						你还没有加入任何组织
					</p>
				</div>
			)}
		</div>
	);
}
