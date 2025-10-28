"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationLogo } from "@/modules/dashboard/organizations/components/OrganizationLogo";
import { EventHostSubscriptionButton } from "@/components/shared/EventHostSubscriptionButton";
import Link from "next/link";

type Organization = {
	id: string;
	name: string;
	slug?: string;
	logo?: string;
};

export function OrganizationCard({
	title,
	organization,
}: {
	title: string;
	organization: Organization;
}) {
	if (!organization) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Link
					href={`/orgs/${organization.slug}`}
					className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
				>
					<OrganizationLogo
						name={organization.name}
						logoUrl={organization.logo}
						className="h-10 w-10"
					/>
					<div>
						<div className="font-medium">{organization.name}</div>
						{organization.slug && (
							<div className="text-sm text-muted-foreground">
								@{organization.slug}
							</div>
						)}
					</div>
				</Link>
				<EventHostSubscriptionButton
					organizationId={organization.id}
					hostName={organization.name}
					size="sm"
				/>
			</CardContent>
		</Card>
	);
}
