"use client";

import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Input } from "@community/ui/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Textarea } from "@community/ui/ui/textarea";
import { Badge } from "@community/ui/ui/badge";
import { Card, CardContent } from "@community/ui/ui/card";
import type {
	FeedbackConfig,
	QuestionType,
} from "@community/lib-server/database/prisma/types/feedback";
import { PlusIcon, TrashIcon, GripVertical } from "lucide-react";
import { useState } from "react";
import { nanoid } from "nanoid";
import type { Control, UseFormSetValue } from "react-hook-form";
import type { EventFormData } from "./types";

interface FeedbackConfigModalProps {
	control: Control<EventFormData>;
	setValue: UseFormSetValue<EventFormData>;
	feedbackConfig?: FeedbackConfig | null;
	children: React.ReactNode;
}

const QUESTION_TYPES: Array<{
	value: QuestionType;
	label: string;
	description: string;
}> = [
	{ value: "text", label: "单行文本", description: "简短的文本输入" },
	{ value: "textarea", label: "多行文本", description: "详细的文本输入" },
	{ value: "rating", label: "评分", description: "1-5星评分" },
	{
		value: "single_choice",
		label: "单选",
		description: "从多个选项中选择一个",
	},
	{ value: "multiple_choice", label: "多选", description: "可选择多个选项" },
	{ value: "yes_no", label: "是/否", description: "简单的是否问题" },
];

export function FeedbackConfigModal({
	control,
	setValue,
	feedbackConfig,
	children,
}: FeedbackConfigModalProps) {
	const [open, setOpen] = useState(false);
	const [questions, setQuestions] = useState<FeedbackConfig["questions"]>(
		feedbackConfig?.questions || [],
	);

	const addQuestion = () => {
		setQuestions([
			...questions,
			{
				id: nanoid(),
				type: "text",
				label: "",
				required: false,
			},
		]);
	};

	const removeQuestion = (index: number) => {
		setQuestions(questions.filter((_, i) => i !== index));
	};

	const updateQuestion = (
		index: number,
		updates: Partial<FeedbackConfig["questions"][0]>,
	) => {
		const newQuestions = [...questions];
		newQuestions[index] = { ...newQuestions[index], ...updates };
		setQuestions(newQuestions);
	};

	const handleSave = () => {
		const config: FeedbackConfig = { questions };
		setValue("feedbackConfig", config as any);
		setOpen(false);
	};

	const handleCancel = () => {
		// Reset to original config
		setQuestions(feedbackConfig?.questions || []);
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>配置反馈问卷</DialogTitle>
					<DialogDescription>
						为活动添加自定义反馈问题，收集参与者的意见和建议
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{questions.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>还没有添加自定义问题</p>
							<p className="text-sm mt-1">点击下方按钮添加问题</p>
						</div>
					) : (
						<div className="space-y-3">
							{questions.map((question, index) => (
								<Card key={question.id} className="border-2">
									<CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
										{/* Header: number + delete */}
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
												<span className="text-sm font-medium text-muted-foreground">
													#{index + 1}
												</span>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() =>
													removeQuestion(index)
												}
											>
												<TrashIcon className="w-4 h-4 text-destructive" />
											</Button>
										</div>

										{/* Question Type + Required */}
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											<div>
												<label className="text-sm font-medium">
													问题类型
												</label>
												<Select
													value={question.type}
													onValueChange={(value) =>
														updateQuestion(index, {
															type: value as QuestionType,
														})
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{QUESTION_TYPES.map(
															(type) => (
																<SelectItem
																	key={
																		type.value
																	}
																	value={
																		type.value
																	}
																>
																	<div>
																		<div className="font-medium">
																			{
																				type.label
																			}
																		</div>
																		<div className="text-xs text-muted-foreground">
																			{
																				type.description
																			}
																		</div>
																	</div>
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>

											<div className="flex items-center gap-2">
												<Checkbox
													id={`required-${question.id}`}
													checked={question.required}
													onCheckedChange={(
														checked,
													) =>
														updateQuestion(index, {
															required:
																checked as boolean,
														})
													}
												/>
												<label
													htmlFor={`required-${question.id}`}
													className="text-sm font-medium cursor-pointer"
												>
													必填问题
												</label>
											</div>
										</div>

										{/* Question Label */}
										<div>
											<label className="text-sm font-medium">
												问题标题
											</label>
											<Input
												value={question.label}
												onChange={(e) =>
													updateQuestion(index, {
														label: e.target.value,
													})
												}
												placeholder="例如：是否愿意成为下次活动的志愿者？"
											/>
										</div>

										{/* Placeholder for text inputs */}
										{(question.type === "text" ||
											question.type === "textarea") && (
											<div>
												<label className="text-sm font-medium">
													输入提示
												</label>
												<Input
													value={
														question.placeholder ||
														""
													}
													onChange={(e) =>
														updateQuestion(index, {
															placeholder:
																e.target.value,
														})
													}
													placeholder="可选的输入提示"
												/>
											</div>
										)}

										{/* Max Length for text inputs */}
										{(question.type === "text" ||
											question.type === "textarea") && (
											<div>
												<label className="text-sm font-medium">
													最大长度（可选）
												</label>
												<Input
													type="number"
													value={
														question.maxLength || ""
													}
													onChange={(e) =>
														updateQuestion(index, {
															maxLength: e.target
																.value
																? Number.parseInt(
																		e.target
																			.value,
																	)
																: undefined,
														})
													}
													placeholder="不限制"
												/>
											</div>
										)}

										{/* Options for choice questions */}
										{(question.type === "single_choice" ||
											question.type ===
												"multiple_choice") && (
											<div>
												<label className="text-sm font-medium">
													选项（每行一个）
												</label>
												<Textarea
													value={
														question.options?.join(
															"\n",
														) || ""
													}
													onChange={(e) =>
														updateQuestion(index, {
															options:
																e.target.value
																	.split("\n")
																	.filter(
																		Boolean,
																	),
														})
													}
													placeholder="选项1&#10;选项2&#10;选项3"
													rows={4}
												/>
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}

					<Button
						type="button"
						variant="outline"
						onClick={addQuestion}
						className="w-full"
					>
						<PlusIcon className="w-4 h-4 mr-2" />
						添加问题
					</Button>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}
					>
						取消
					</Button>
					<Button type="button" onClick={handleSave}>
						保存配置
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Summary component to display feedback config summary
 */
export function FeedbackConfigSummary({
	feedbackConfig,
}: {
	feedbackConfig?: FeedbackConfig | null;
}) {
	if (!feedbackConfig || feedbackConfig.questions.length === 0) {
		return (
			<p className="text-xs text-muted-foreground mt-1">
				使用默认反馈问题（评分、评论、建议、推荐意愿）
			</p>
		);
	}

	return (
		<div className="mt-1 space-y-1">
			<p className="text-xs text-muted-foreground">
				已配置 {feedbackConfig.questions.length} 个自定义问题
			</p>
			<div className="flex flex-wrap gap-1">
				{feedbackConfig.questions.slice(0, 3).map((q) => (
					<Badge key={q.id} variant="secondary" className="text-xs">
						{QUESTION_TYPES.find((t) => t.value === q.type)?.label}
						{q.required && " *"}
					</Badge>
				))}
				{feedbackConfig.questions.length > 3 && (
					<Badge variant="outline" className="text-xs">
						+{feedbackConfig.questions.length - 3}
					</Badge>
				)}
			</div>
		</div>
	);
}
