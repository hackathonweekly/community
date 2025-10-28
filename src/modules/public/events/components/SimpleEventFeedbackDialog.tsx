"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { Copy, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { CustomFeedbackField } from "./CustomFeedbackField";
import type {
	FeedbackConfig,
	CustomAnswers,
} from "@/lib/database/prisma/types/feedback";

interface SimpleEventFeedbackDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventTitle: string;
	eventId: string;
	feedbackConfig?: FeedbackConfig | null;
	onSubmit: (feedback: {
		rating: number;
		comment: string;
		suggestions: string;
		wouldRecommend: boolean;
		customAnswers?: CustomAnswers;
	}) => void;
	existingFeedback?: {
		rating: number;
		comment?: string;
		suggestions?: string;
		wouldRecommend: boolean;
		customAnswers?: CustomAnswers;
	} | null;
	isEditing?: boolean;
}

export function SimpleEventFeedbackDialog({
	open,
	onOpenChange,
	eventTitle,
	eventId,
	feedbackConfig,
	onSubmit,
	existingFeedback,
	isEditing = false,
}: SimpleEventFeedbackDialogProps) {
	const locale = useLocale();
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [suggestions, setSuggestions] = useState("");
	const [wouldRecommend, setWouldRecommend] = useState(false);
	const [customAnswers, setCustomAnswers] = useState<CustomAnswers>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [feedbackUrl, setFeedbackUrl] = useState("");
	const [qrPopoverOpen, setQrPopoverOpen] = useState(false);
	const toastsT = useTranslations("events.feedback.toasts");

	// 当对话框打开或 existingFeedback 变化时重置状态
	useEffect(() => {
		if (open) {
			setRating(existingFeedback?.rating || 0);
			setComment(existingFeedback?.comment || "");
			setSuggestions(existingFeedback?.suggestions || "");
			setWouldRecommend(existingFeedback?.wouldRecommend || false);
			setCustomAnswers(existingFeedback?.customAnswers || {});
		}
	}, [open, existingFeedback]);

	useEffect(() => {
		if (!eventId) return;
		if (typeof window === "undefined") return;
		const origin = window.location.origin;
		const localeSegment = locale || "zh";
		setFeedbackUrl(
			`${origin}/${localeSegment}/events/${eventId}?feedback=true`,
		);
	}, [eventId, locale]);

	useEffect(() => {
		if (!open) {
			setQrPopoverOpen(false);
		}
	}, [open]);

	const handleCopyLink = async () => {
		if (!feedbackUrl) {
			return;
		}
		try {
			await navigator.clipboard.writeText(feedbackUrl);
			toast.success(toastsT("linkCopied"));
		} catch (error) {
			console.error("Failed to copy feedback link:", error);
			toast.error(toastsT("copyFailed"));
		}
	};

	const handleSubmit = async () => {
		if (rating === 0) {
			return;
		}

		// Validate custom answers if feedbackConfig exists
		if (feedbackConfig) {
			const { validateAnswersAgainstConfig } = await import(
				"@/lib/database/prisma/types/feedback"
			);
			const validation = validateAnswersAgainstConfig(
				customAnswers,
				feedbackConfig,
			);
			if (!validation.valid) {
				toast.error(
					validation.errors[0] || "请填写所有必填的自定义问题",
				);
				return;
			}
		}

		setIsSubmitting(true);
		try {
			await onSubmit({
				rating,
				comment: comment.trim(),
				suggestions: suggestions.trim(),
				wouldRecommend,
				customAnswers:
					Object.keys(customAnswers).length > 0
						? customAnswers
						: undefined,
			});

			// 只在新建反馈时重置表单，编辑时保持当前值
			if (!isEditing) {
				setRating(0);
				setComment("");
				setSuggestions("");
				setWouldRecommend(false);
				setCustomAnswers({});
			}
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to submit feedback:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const canSubmit = rating > 0;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader className="pb-3 text-left">
					<div className="space-y-1">
						<DialogTitle className="text-base font-semibold">
							{isEditing ? "修改活动反馈" : "活动反馈"}
						</DialogTitle>
						<p className="text-xs text-muted-foreground">
							{eventTitle}
						</p>
					</div>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={handleCopyLink}
							disabled={!feedbackUrl}
							className="h-8 w-8 text-muted-foreground hover:text-foreground"
						>
							<Copy className="h-4 w-4" />
							<span className="sr-only">复制反馈链接</span>
						</Button>
						<Popover
							open={qrPopoverOpen}
							onOpenChange={(nextOpen) => {
								if (!feedbackUrl && nextOpen) {
									return;
								}
								setQrPopoverOpen(nextOpen);
							}}
						>
							<PopoverTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									disabled={!feedbackUrl}
									className="h-8 w-8 text-muted-foreground hover:text-foreground"
								>
									<QrCode className="h-4 w-4" />
									<span className="sr-only">
										查看反馈二维码
									</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent
								className="w-auto p-4 flex flex-col items-center gap-3"
								align="start"
							>
								{feedbackUrl ? (
									<>
										<QRCode
											value={feedbackUrl}
											size={180}
										/>
										<p className="text-xs text-muted-foreground break-all text-center max-w-[180px]">
											{feedbackUrl}
										</p>
										<p className="text-[11px] text-muted-foreground text-center">
											截图或右键即可分享/保存
										</p>
									</>
								) : (
									<p className="text-xs text-muted-foreground">
										正在生成分享信息…
									</p>
								)}
							</PopoverContent>
						</Popover>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					{/* 评分 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							总体评分 <span className="text-red-500">*</span>
						</Label>
						<div className="flex items-center gap-1">
							{[1, 2, 3, 4, 5].map((star) => {
								const isFilled =
									star <= (hoveredRating || rating);
								return (
									<button
										key={star}
										type="button"
										onClick={() => setRating(star)}
										onMouseEnter={() =>
											setHoveredRating(star)
										}
										onMouseLeave={() => setHoveredRating(0)}
										className="p-0.5 hover:scale-110 transition-transform"
									>
										{isFilled ? (
											<StarIcon className="w-6 h-6 text-yellow-400" />
										) : (
											<StarOutlineIcon className="w-6 h-6 text-gray-300" />
										)}
									</button>
								);
							})}
							<span className="ml-2 text-xs text-muted-foreground">
								{rating > 0 ? `${rating}/5` : "请选择评分"}
							</span>
						</div>
					</div>

					{/* 评论 */}
					<div className="space-y-2">
						<Label
							htmlFor="comment"
							className="text-sm font-medium"
						>
							活动体验分享
						</Label>
						<Textarea
							id="comment"
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="分享您参加活动的感受、收获或印象深刻的内容..."
							className="min-h-[80px] resize-none text-sm"
							maxLength={500}
						/>
						<div className="text-xs text-muted-foreground text-right">
							{comment.length}/500
						</div>
					</div>

					{/* 建议 */}
					<div className="space-y-2">
						<Label
							htmlFor="suggestions"
							className="text-sm font-medium"
						>
							改进建议
						</Label>
						<Textarea
							id="suggestions"
							value={suggestions}
							onChange={(e) => setSuggestions(e.target.value)}
							placeholder="有什么可以改进的地方吗？（可选）"
							className="min-h-[60px] resize-none text-sm"
							maxLength={300}
						/>
						<div className="text-xs text-muted-foreground text-right">
							{suggestions.length}/300
						</div>
					</div>

					{/* 推荐 */}
					<div className="space-y-2">
						<Label className="text-sm font-medium">
							您是否会推荐这个活动？
						</Label>
						<div
							onClick={() => setWouldRecommend(!wouldRecommend)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setWouldRecommend(!wouldRecommend);
								}
							}}
							tabIndex={0}
							role="button"
							aria-pressed={wouldRecommend}
							className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
						>
							<input
								type="checkbox"
								checked={wouldRecommend}
								readOnly
								className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-1 cursor-pointer"
							/>
							<span className="text-sm">
								是的，我会推荐给朋友
							</span>
						</div>
					</div>

					{/* 自定义问题 */}
					{feedbackConfig?.questions &&
						feedbackConfig.questions.length > 0 && (
							<div className="border-t pt-4">
								<h3 className="text-sm font-medium text-muted-foreground mb-3">
									活动问卷
								</h3>
								<div className="space-y-4">
									{feedbackConfig.questions.map(
										(question) => (
											<CustomFeedbackField
												key={question.id}
												question={question}
												value={
													customAnswers[question.id]
												}
												onChange={(value) =>
													setCustomAnswers(
														(prev) => ({
															...prev,
															[question.id]:
																value,
														}),
													)
												}
											/>
										),
									)}
								</div>
							</div>
						)}
				</div>

				{/* 提交按钮 */}
				<div className="flex gap-2 pt-3">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="flex-1"
						disabled={isSubmitting}
					>
						取消
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={!canSubmit || isSubmitting}
						className="flex-1"
					>
						{isSubmitting
							? isEditing
								? "修改中..."
								: "提交中..."
							: isEditing
								? "修改反馈"
								: "提交反馈"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
