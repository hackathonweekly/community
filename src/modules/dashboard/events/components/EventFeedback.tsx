"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	HeartIcon,
	LightBulbIcon,
	PencilIcon,
	StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type {
	FeedbackConfig,
	CustomAnswers,
} from "@/lib/database/prisma/types/feedback";

interface EventFeedback {
	id: string;
	rating: number;
	comment?: string;
	suggestions?: string;
	wouldRecommend: boolean;
	customAnswers?: CustomAnswers;
	createdAt: string;
	user: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface EventFeedbackProps {
	eventId: string;
	eventStatus: string;
	feedbackConfig?: FeedbackConfig | null;
	userRegistration?: {
		id: string;
		status: string;
		user?: {
			id: string;
		};
		// Add other registration properties as needed
	};
	isEventPast: boolean;
	adminView?: boolean; // New prop to indicate admin/organizer view
	isOrganizer?: boolean; // New prop to indicate if current user is the organizer
}

export function EventFeedback({
	eventId,
	feedbackConfig,
	userRegistration,
	isEventPast,
	adminView = false,
	isOrganizer = false,
}: EventFeedbackProps) {
	const [feedback, setFeedback] = useState<EventFeedback[]>([]);
	const [userFeedback, setUserFeedback] = useState<EventFeedback | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [showFeedbackForm, setShowFeedbackForm] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Form state
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const [suggestions, setSuggestions] = useState("");
	const [wouldRecommend, setWouldRecommend] = useState(false);
	const t = useTranslations("events.feedback");

	const fetchFeedback = async () => {
		try {
			const response = await fetch(`/api/events/${eventId}/feedback`, {
				credentials: "include", // 添加认证cookie
			});
			if (response.ok) {
				const data = await response.json();
				setFeedback(data.data);
			} else {
				console.log("Failed to fetch feedback (organizer only)");
			}
		} catch (error) {
			console.error("Error fetching feedback:", error);
		} finally {
			setLoading(false);
		}
	};

	// Fetch user's own feedback (separate endpoint for non-organizers)
	const fetchUserFeedback = async () => {
		if (!userRegistration) {
			return;
		}

		try {
			const response = await fetch(`/api/events/${eventId}/my-feedback`, {
				credentials: "include", // 添加认证cookie
			});
			if (response.ok) {
				const data = await response.json();
				if (data.data) {
					setUserFeedback(data.data);
					// Also add to the general feedback list if not already present (for organizers)
					setFeedback((prev) => {
						const exists = prev.some(
							(f) => f.user.id === userRegistration.user?.id,
						);
						return exists ? prev : [data.data, ...prev];
					});
				}
			}
		} catch (error) {
			console.error("Error fetching user feedback:", error);
		}
	};

	const handleSubmitFeedback = async () => {
		if (rating === 0) {
			toast.error(t("pleaseProvideRating"));
			return;
		}

		setSubmitting(true);
		try {
			const url = isEditing
				? `/api/events/${eventId}/feedback`
				: `/api/events/${eventId}/feedback`;
			const method = isEditing ? "PUT" : "POST";

			const body = {
				rating,
				comment: comment.trim() || undefined,
				suggestions: suggestions.trim() || undefined,
				wouldRecommend,
			};

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include", // 添加认证cookie
				body: JSON.stringify(body),
			});

			if (response.ok) {
				const responseData = await response.json();
				toast.success(
					isEditing ? t("feedbackUpdated") : t("thankYouForFeedback"),
				);
				setShowFeedbackForm(false);
				setIsEditing(false);
				setRating(0);
				setComment("");
				setSuggestions("");
				setWouldRecommend(false);

				// Update the user feedback directly from response
				if (responseData.data) {
					setUserFeedback(responseData.data);
				}

				fetchFeedback(); // Refresh feedback list
				fetchUserFeedback(); // Refresh user's own feedback
			} else {
				const error = await response.json();
				toast.error(error.error || t("notifications.submitError"));
			}
		} catch (error) {
			console.error("Error submitting feedback:", error);
			toast.error(t("notifications.submitError"));
		} finally {
			setSubmitting(false);
		}
	};

	const handleEditFeedback = (userFeedback: EventFeedback) => {
		console.log("Editing feedback:", userFeedback);
		setRating(userFeedback.rating);
		setComment(userFeedback.comment || "");
		setSuggestions(userFeedback.suggestions || "");
		setWouldRecommend(userFeedback.wouldRecommend);
		setIsEditing(true);
		setShowFeedbackForm(true);
		console.log("Feedback form should now be visible");
	};

	useEffect(() => {
		// Only fetch all feedback if user is organizer or admin
		if (adminView || isOrganizer) {
			fetchFeedback();
		} else {
			// For non-organizers, just set loading to false
			setLoading(false);
		}
		// Always fetch user's own feedback
		fetchUserFeedback();
	}, [eventId, userRegistration, adminView, isOrganizer]);

	const averageRating =
		feedback.length > 0
			? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
			: 0;

	const recommendationRate =
		feedback.length > 0
			? (feedback.filter((f) => f.wouldRecommend).length /
					feedback.length) *
				100
			: 0;

	// User can submit feedback if they are registered and confirmed, and it's not admin view
	// Allow feedback anytime - no time restrictions
	const canSubmitFeedback =
		!adminView &&
		userRegistration &&
		userRegistration.status === "APPROVED";

	// Check if current user has already submitted feedback
	const hasSubmittedFeedback = !!userFeedback;

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="animate-pulse space-y-4">
					{[...Array(3)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="space-y-3">
									<div className="h-4 bg-gray-200 rounded w-1/4" />
									<div className="h-16 bg-gray-200 rounded" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Feedback Stats - Only show to organizers/admins */}
			{(adminView || isOrganizer) && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-3">
								<StarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="text-xl sm:text-2xl font-bold">
										{averageRating.toFixed(1)}
									</p>
									<p className="text-xs sm:text-sm text-gray-600">
										{t("averageRating")}
									</p>
									<div className="flex mt-1">
										{[1, 2, 3, 4, 5].map((star) => (
											<StarIconSolid
												key={star}
												className={`h-3 w-3 sm:h-4 sm:w-4 ${
													star <= averageRating
														? "text-yellow-400"
														: "text-gray-300"
												}`}
											/>
										))}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-3">
								<HeartIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="text-xl sm:text-2xl font-bold">
										{Math.round(recommendationRate)}%
									</p>
									<p className="text-xs sm:text-sm text-gray-600">
										{t("recommendationRate")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="sm:col-span-2 lg:col-span-1">
						<CardContent className="p-4 sm:p-6">
							<div className="flex items-center space-x-3">
								<LightBulbIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
								<div className="min-w-0 flex-1">
									<p className="text-xl sm:text-2xl font-bold">
										{feedback.length}
									</p>
									<p className="text-xs sm:text-sm text-gray-600">
										{t("totalReviews")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* User's Own Feedback Display */}
			{canSubmitFeedback &&
				hasSubmittedFeedback &&
				userFeedback &&
				!showFeedbackForm && (
					<Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-transparent">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="p-2 rounded-lg bg-green-100">
										<HeartIcon className="h-5 w-5 text-green-600" />
									</div>
									<div>
										<CardTitle className="text-lg font-semibold text-green-900">
											{t("yourFeedback")}
										</CardTitle>
										<CardDescription className="text-sm text-green-700">
											{t("thankYou")}
										</CardDescription>
									</div>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										handleEditFeedback(userFeedback)
									}
									className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
								>
									<PencilIcon className="h-4 w-4" />
									{t("edit")}
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* User's rating */}
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">
										{t("rating")}
									</span>
									<div className="flex">
										{[1, 2, 3, 4, 5].map((star) => (
											<span
												key={star}
												className={`text-lg ${
													star <= userFeedback.rating
														? "text-yellow-400"
														: "text-gray-300"
												}`}
											>
												★
											</span>
										))}
									</div>
									<span className="text-sm text-muted-foreground">
										({userFeedback.rating}/5)
									</span>
								</div>

								{/* User's comment */}
								{userFeedback.comment && (
									<div>
										<span className="text-sm font-medium">
											{t("comment")}
										</span>
										<p className="text-sm text-gray-700 mt-1 p-3 bg-white rounded border">
											{userFeedback.comment}
										</p>
									</div>
								)}

								{/* User's suggestions */}
								{userFeedback.suggestions && (
									<div>
										<span className="text-sm font-medium">
											{t("suggestions")}
										</span>
										<p className="text-sm text-gray-700 mt-1 p-3 bg-blue-50 rounded border border-blue-200">
											{userFeedback.suggestions}
										</p>
									</div>
								)}

								{/* Recommendation status */}
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">
										{t("recommend")}
									</span>
									<Badge
										variant={
											userFeedback.wouldRecommend
												? "default"
												: "secondary"
										}
									>
										{userFeedback.wouldRecommend
											? t("wouldRecommend")
											: t("wouldNotRecommend")}
									</Badge>
								</div>

								<div className="text-xs text-muted-foreground pt-2 border-t">
									{t("submittedAt")}
									{new Date(
										userFeedback.createdAt,
									).toLocaleString()}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

			{/* Submit Feedback Form */}
			{canSubmitFeedback && (!hasSubmittedFeedback || isEditing) && (
				<Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
					<CardHeader className="pb-3">
						<div className="flex items-center gap-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<HeartIcon className="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle className="text-lg font-semibold">
									{isEditing
										? t("editYourFeedback")
										: isEventPast
											? t("shareYourExperience")
											: t("realTimeFeedback")}
								</CardTitle>
								<CardDescription className="text-sm text-muted-foreground">
									{isEditing
										? t("updateYourFeedback")
										: isEventPast
											? t("helpUsImprove")
											: t("shareThoughts")}
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{!showFeedbackForm ? (
							<Button
								onClick={() => setShowFeedbackForm(true)}
								className="w-full sm:w-auto bg-primary hover:bg-primary/90"
								size="lg"
							>
								{isEventPast
									? t("leaveFeedback")
									: t("shareThoughts")}
							</Button>
						) : (
							<div className="space-y-6">
								{/* Rating */}
								<div>
									<label
										htmlFor="rating-buttons"
										className="block text-sm font-medium mb-3"
									>
										{isEventPast
											? t("eventRatingQuestion")
											: t("currentFeelingsQuestion")}
									</label>
									<div
										id="rating-buttons"
										className="flex space-x-2"
										role="radiogroup"
										aria-labelledby="rating-label"
									>
										{[1, 2, 3, 4, 5].map((star) => (
											<button
												key={star}
												type="button"
												onClick={() => setRating(star)}
												role="radio"
												aria-checked={star === rating}
												aria-label={`评分 ${star} 星`}
												className="p-1 focus:outline-none transition-transform hover:scale-110"
											>
												<StarIconSolid
													className={`h-8 w-8 ${
														star <= rating
															? "text-yellow-400"
															: "text-gray-300"
													} hover:text-yellow-400 transition-colors`}
												/>
											</button>
										))}
									</div>
								</div>

								{/* Comment */}
								<div>
									<label
										htmlFor="comment-textarea"
										className="block text-sm font-medium mb-2"
									>
										{isEventPast
											? t("eventThoughtsQuestion")
											: t("realTimeFeelings")}
									</label>
									<Textarea
										id="comment-textarea"
										placeholder={
											isEventPast
												? t(
														"shareExperiencePlaceholder",
													)
												: t("shareRealTimePlaceholder")
										}
										value={comment}
										onChange={(e) =>
											setComment(e.target.value)
										}
										rows={4}
										className="resize-none"
									/>
								</div>

								{/* Suggestions */}
								<div>
									<label
										htmlFor="suggestions-textarea"
										className="block text-sm font-medium mb-2"
									>
										{t("improvementSuggestions")}
									</label>
									<Textarea
										id="suggestions-textarea"
										placeholder={t(
											"improvementPlaceholder",
										)}
										value={suggestions}
										onChange={(e) =>
											setSuggestions(e.target.value)
										}
										rows={3}
										className="resize-none"
									/>
								</div>

								{/* Recommendation - Improved interaction */}
								<div
									onClick={() =>
										setWouldRecommend(!wouldRecommend)
									}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" ||
											e.key === " "
										) {
											e.preventDefault();
											setWouldRecommend(!wouldRecommend);
										}
									}}
									tabIndex={0}
									role="button"
									aria-pressed={wouldRecommend}
									className="flex items-center space-x-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
								>
									<div className="relative">
										<input
											type="checkbox"
											id="recommend"
											checked={wouldRecommend}
											readOnly
											className="w-5 h-5 rounded border-2 border-gray-300 text-primary focus:ring-primary focus:ring-2 cursor-pointer"
										/>
									</div>
									<div className="flex-1">
										<label
											htmlFor="recommend"
											className="text-base font-medium cursor-pointer group-hover:text-primary transition-colors"
										>
											{t("recommendEvent")}
										</label>
										<p className="text-sm text-muted-foreground mt-1">
											{t("clickToRecommend")}
										</p>
									</div>
								</div>

								{/* Actions */}
								<div className="flex space-x-3 pt-2">
									<Button
										onClick={handleSubmitFeedback}
										disabled={submitting || rating === 0}
										className="flex-1 bg-primary hover:bg-primary/90"
									>
										{submitting
											? isEditing
												? t("updating")
												: t("submitting")
											: isEditing
												? t("updateFeedback")
												: t("submitFeedback")}
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setShowFeedbackForm(false);
											setIsEditing(false);
											setRating(0);
											setComment("");
											setSuggestions("");
											setWouldRecommend(false);
										}}
									>
										{t("cancel")}
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Feedback List - Only show to organizers/admins */}
			{(adminView || isOrganizer) && (
				<Card>
					<CardHeader>
						<CardTitle>
							{t("eventReviews", { count: feedback.length })}
						</CardTitle>
						<CardDescription>
							{t("participantReviews")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{feedback.length === 0 ? (
							<div className="text-center py-12">
								<LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
								<h3 className="mt-2 text-sm font-medium text-gray-900">
									{t("noReviews")}
								</h3>
								<p className="mt-1 text-sm text-gray-500">
									{t("reviewsWillAppear")}
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{feedback.map((review) => (
									<div
										key={review.id}
										className="border-b last:border-b-0 pb-6 last:pb-0"
									>
										<div className="flex items-start space-x-3">
											<Avatar className="h-10 w-10">
												<AvatarImage
													src={review.user.image}
												/>
												<AvatarFallback>
													{review.user.name?.charAt(
														0,
													) || "U"}
												</AvatarFallback>
											</Avatar>

											<div className="flex-1">
												<div className="flex items-center space-x-2 mb-2">
													<p className="font-medium">
														{review.user.name}
													</p>
													<div className="flex">
														{[1, 2, 3, 4, 5].map(
															(star) => (
																<StarIconSolid
																	key={star}
																	className={`h-4 w-4 ${
																		star <=
																		review.rating
																			? "text-yellow-400"
																			: "text-gray-300"
																	}`}
																/>
															),
														)}
													</div>
													{review.wouldRecommend && (
														<Badge
															variant="secondary"
															className="text-xs"
														>
															{t("recommend")}
														</Badge>
													)}
												</div>

												{review.comment && (
													<p className="text-gray-700 mb-3">
														{review.comment}
													</p>
												)}

												{review.suggestions && (
													<div className="bg-blue-50 p-3 rounded-lg mb-3">
														<p className="text-sm font-medium text-blue-900 mb-1">
															{t(
																"improvementSuggestionsLabel",
															)}
														</p>
														<p className="text-sm text-blue-800">
															{review.suggestions}
														</p>
													</div>
												)}

												{/* 自定义答案展示 */}
												{review.customAnswers &&
													feedbackConfig && (
														<div className="space-y-2 mt-3 pt-3 border-t">
															<p className="text-xs font-medium text-gray-600 mb-2">
																活动问卷回答
															</p>
															{Object.entries(
																review.customAnswers,
															).map(
																([
																	questionId,
																	answer,
																]) => {
																	const question =
																		feedbackConfig.questions.find(
																			(
																				q,
																			) =>
																				q.id ===
																				questionId,
																		);
																	if (
																		!question
																	)
																		return null;

																	return (
																		<div
																			key={
																				questionId
																			}
																			className="bg-gray-50 p-2 rounded text-sm"
																		>
																			<p className="font-medium text-gray-700 mb-1">
																				{
																					question.label
																				}
																			</p>
																			<p className="text-gray-600">
																				{Array.isArray(
																					answer,
																				)
																					? answer.join(
																							", ",
																						)
																					: typeof answer ===
																							"boolean"
																						? answer
																							? "是"
																							: "否"
																						: String(
																								answer,
																							)}
																			</p>
																		</div>
																	);
																},
															)}
														</div>
													)}

												<p className="text-xs text-gray-500">
													{new Date(
														review.createdAt,
													).toLocaleDateString()}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
