import { EventHostSubscriptionButton } from "@/components/shared/EventHostSubscriptionButton";

import { SectionCard } from "../common/SectionCard";
import { HostCard } from "../common/HostCard";
import type { EventData } from "../types";

export function HostsSection({
	event,
	canContactOrganizer,
}: {
	event: EventData;
	canContactOrganizer: boolean;
}) {
	const subscriptionTarget = event.organization
		? {
				organizationId: event.organization.id,
				hostName: event.organization.name,
			}
		: event.organizer
			? {
					hostUserId: event.organizer.id,
					hostName: event.organizer.name,
				}
			: null;

	return (
		<SectionCard id="hosts" title="主办与社群">
			<div className="grid gap-3 sm:grid-cols-2">
				<HostCard
					title="组织者"
					name={event.organizer?.name}
					username={event.organizer?.username}
					image={event.organizer?.image}
					highlight={
						event.organizer?.bio || event.organizer?.userRoleString
					}
				/>
				{event.organization ? (
					<HostCard
						title="组织/社区"
						name={event.organization.name}
						image={event.organization.logo}
						highlight={event.organization.slug}
					/>
				) : null}
			</div>
			{canContactOrganizer ? (
				<p className="mt-3 text-xs text-muted-foreground">
					有问题？可直接联系组织者，或在下方提交反馈。
				</p>
			) : null}
			{subscriptionTarget ? (
				<div className="mt-3">
					<EventHostSubscriptionButton
						{...subscriptionTarget}
						variant="outline"
						className="w-full sm:w-auto"
					/>
				</div>
			) : null}
		</SectionCard>
	);
}
