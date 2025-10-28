"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";

type FeedbackUser = {
	id: string;
	name: string;
	image?: string;
};

type Feedback = {
	id: string;
	rating: number;
	comment?: string;
	user: FeedbackUser;
};

export function FeedbackSummaryCard({
	title,
	feedbacks,
}: {
	title: string;
	feedbacks: Feedback[];
}) {
	if (!feedbacks || feedbacks.length === 0) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{feedbacks.slice(0, 3).map((feedback) => (
						<div
							key={feedback.id}
							className="border-b pb-4 last:border-b-0"
						>
							<div className="flex items-center gap-2 mb-2">
								<UserAvatar
									name={feedback.user.name}
									avatarUrl={feedback.user.image}
									className="w-8 h-8"
								/>
								<div>
									<div className="font-medium text-sm">
										{feedback.user.name}
									</div>
									<div className="flex items-center gap-1">
										{[...Array(5)].map((_, i) => (
											<span
												key={i}
												className={`text-xs ${i < feedback.rating ? "text-yellow-400" : "text-gray-300"}`}
											>
												★
											</span>
										))}
									</div>
								</div>
							</div>
							{feedback.comment && (
								<p className="text-sm text-muted-foreground">
									{feedback.comment}
								</p>
							)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
