import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, GlobeIcon, Users } from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "../types";
import { eventStatusColors, getEventStatusLabel } from "../types";

interface SharedEventsSectionProps {
	user: UserProfile;
	currentUserId?: string;
	userProfileT: (key: string) => string;
	t: any;
}

export function SharedEventsSection({
	user,
	currentUserId,
	userProfileT,
	t,
}: SharedEventsSectionProps) {
	if (
		!currentUserId ||
		currentUserId === user.id ||
		!user.sharedEvents ||
		user.sharedEvents.length === 0
	) {
		return null;
	}

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					{userProfileT("ourConnection")} -{" "}
					{userProfileT("sharedEvents")} ({user.sharedEvents.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{user.sharedEvents.map((event: any) => (
						<Link
							key={event.id}
							href={`/events/${event.id}`}
							className="block p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-50 hover:to-purple-50"
						>
							<div className="flex justify-between items-start mb-2">
								<h3 className="font-semibold text-lg hover:text-primary transition-colors">
									{event.title}
								</h3>
								<div className="flex gap-2">
									<Badge
										variant="outline"
										className={`text-xs ${
											eventStatusColors[
												event.status as keyof typeof eventStatusColors
											]
										}`}
									>
										{getEventStatusLabel(event.status, t)}
									</Badge>
									{event.type && (
										<Badge
											variant="secondary"
											className="text-xs"
										>
											{event.type}
										</Badge>
									)}
								</div>
							</div>

							{event.shortDescription && (
								<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
									{event.shortDescription}
								</p>
							)}

							{/* Event Details */}
							<div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
								<div className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									{new Date(
										event.startTime,
									).toLocaleDateString("zh-CN", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</div>
								{event.address && (
									<div className="flex items-center gap-1">
										<GlobeIcon className="h-3 w-3" />
										{event.address}
									</div>
								)}
								<div className="flex items-center gap-1">
									<Users className="h-3 w-3" />
									{event._count.registrations}{" "}
									{userProfileT("participants")}
								</div>
							</div>

							{/* Tags */}
							{event.tags && event.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{event.tags
										.slice(0, 3)
										.map((tag: string, index: number) => (
											<Badge
												key={index}
												variant="outline"
												className="text-xs"
											>
												{tag}
											</Badge>
										))}
									{event.tags.length > 3 && (
										<Badge
											variant="secondary"
											className="text-xs"
										>
											+{event.tags.length - 3}
										</Badge>
									)}
								</div>
							)}
						</Link>
					))}
				</div>

				{user.sharedEvents.length > 0 && (
					<div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-center">
						<p className="text-sm text-muted-foreground">
							🎉 你们一起参加了 {user.sharedEvents.length}{" "}
							个活动，真是难得的缘分！
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
