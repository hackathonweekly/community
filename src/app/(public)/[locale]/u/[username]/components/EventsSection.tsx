import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, GlobeIcon, Users } from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "../types";
import { eventStatusColors, eventStatusLabels } from "../types";

interface EventsSectionProps {
	user: UserProfile;
	currentUserId?: string;
	userProfileT: (key: string) => string;
}

export function EventsSection({
	user,
	currentUserId,
	userProfileT,
}: EventsSectionProps) {
	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5" />
					{userProfileT("eventsCreated")} ({user.events?.length || 0})
				</CardTitle>
			</CardHeader>
			<CardContent>
				{user.events && user.events.length > 0 ? (
					<>
						<div className="space-y-4">
							{user.events.slice(0, 3).map((event: any) => (
								<Link
									key={event.id}
									href={`/events/${event.id}`}
									className="block p-4 border rounded-lg hover:shadow-md transition-shadow"
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
												{
													eventStatusLabels[
														event.status as keyof typeof eventStatusLabels
													]
												}
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
										<div className="flex flex-wrap gap-1 mb-3">
											{event.tags
												.slice(0, 3)
												.map(
													(
														tag: string,
														index: number,
													) => (
														<Badge
															key={index}
															variant="outline"
															className="text-xs"
														>
															{tag}
														</Badge>
													),
												)}
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
						{user.events && user.events.length > 3 && (
							<div className="mt-4 text-center">
								<Button variant="outline" size="sm" asChild>
									<Link
										href={
											currentUserId === user.id
												? "/app/events"
												: "#"
										}
									>
										查看全部 {user.events.length} 个活动
									</Link>
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-muted-foreground">
						<div className="mb-2">📅</div>
						<p className="text-sm">
							{currentUserId === user.id
								? "你还没有创建任何活动"
								: "该用户还没有创建任何活动"}
						</p>
						{currentUserId === user.id && (
							<Button
								variant="outline"
								size="sm"
								className="mt-3"
								asChild
							>
								<Link href="/app/events/create">创建活动</Link>
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
