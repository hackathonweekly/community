"use client";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { UserAvatar } from "@community/ui/shared/UserAvatar";
import { EventHostSubscriptionButton } from "@community/ui/shared/EventHostSubscriptionButton";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Organizer = {
	id: string;
	name: string;
	image?: string;
	username?: string;
	bio?: string;
	userRoleString?: string;
	city?: string;
};

export function OrganizerCard({
	title,
	organizer,
	showSubscription = true,
}: {
	title: string;
	organizer: Organizer;
	showSubscription?: boolean;
}) {
	const pathname = usePathname();

	const organizerIdOrUsername = organizer.username || organizer.id;
	const returnTo = pathname
		? `?returnTo=${encodeURIComponent(pathname)}`
		: "";

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Link
					href={`/u/${organizerIdOrUsername}${returnTo}`}
					className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
				>
					<UserAvatar
						name={organizer.name}
						avatarUrl={organizer.image}
						className="h-10 w-10"
					/>
					<div>
						<div className="font-medium">{organizer.name}</div>
						{organizer.userRoleString && (
							<div className="text-sm text-muted-foreground">
								{organizer.userRoleString}
							</div>
						)}
						{organizer.city && (
							<div className="text-sm text-muted-foreground">
								{organizer.city}
							</div>
						)}
					</div>
				</Link>
				{organizer.bio && (
					<p className="text-sm text-muted-foreground line-clamp-3">
						{organizer.bio}
					</p>
				)}
				{showSubscription && (
					<EventHostSubscriptionButton
						hostUserId={organizer.id}
						hostName={organizer.name}
						size="sm"
					/>
				)}
			</CardContent>
		</Card>
	);
}
