"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { useTranslations } from "next-intl";

interface EventOverviewTabProps {
	event: {
		richContent: string;
		shortDescription?: string | null;
		startTime: string;
		endTime: string;
		isOnline: boolean;
		address?: string;
		maxAttendees?: number;
		questions: Array<{
			id: string;
			question: string;
			type: string;
			required: boolean;
			options: string[];
			order: number;
		}>;
	};
	confirmedCount: number;
}

export function EventOverviewTab({
	event,
	confirmedCount,
}: EventOverviewTabProps) {
	const t = useTranslations("events.manage");

	return (
		<div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("overview.eventDetails")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-2 md:gap-4">
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								{t("overview.startTime")}
							</div>
							<p className="mt-1">
								{format(new Date(event.startTime), "PPp")}
							</p>
						</div>
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								{t("overview.endTime")}
							</div>
							<p className="mt-1">
								{format(new Date(event.endTime), "PPp")}
							</p>
						</div>
					</div>
					<div>
						<div className="text-sm font-medium text-muted-foreground">
							{t("overview.location")}
						</div>
						<p className="mt-1">
							{event.isOnline
								? t("overview.onlineEvent")
								: event.address}
						</p>
					</div>
					{event.maxAttendees && (
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								{t("overview.capacity")}
							</div>
							<p className="mt-1">
								{confirmedCount} / {event.maxAttendees}{" "}
								{t("overview.attendees")}
							</p>
						</div>
					)}
					<div>
						<div className="text-sm font-medium text-muted-foreground">
							{t("overview.description")}
						</div>
						<p className="mt-1">
							{event.shortDescription || "暂无描述"}
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("overview.registrationQuestions")}</CardTitle>
					<CardDescription>
						{t("overview.questionsConfigured", {
							count: event.questions.length,
						})}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{event.questions.length === 0 ? (
						<p className="text-muted-foreground">
							{t("overview.noQuestionsConfigured")}
						</p>
					) : (
						<div className="space-y-3">
							{event.questions
								.sort((a, b) => a.order - b.order)
								.map((question, index) => (
									<div
										key={question.id}
										className="border rounded-lg p-2 md:p-3"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<p className="font-medium">
													{index + 1}.{" "}
													{question.question}
													{question.required && (
														<span className="text-red-500 ml-1">
															{t(
																"overview.required",
															)}
														</span>
													)}
												</p>
												<p className="text-sm text-muted-foreground capitalize">
													{question.type
														.toLowerCase()
														.replace("_", " ")}
												</p>
												{question.options.length >
													0 && (
													<div className="mt-2">
														<p className="text-xs text-muted-foreground">
															{t(
																"overview.options",
															)}
														</p>
														<ul className="text-sm text-muted-foreground ml-2">
															{question.options.map(
																(option, i) => (
																	<li key={i}>
																		•{" "}
																		{option}
																	</li>
																),
															)}
														</ul>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
