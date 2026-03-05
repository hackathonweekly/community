"use client";

import { useState } from "react";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Textarea } from "@community/ui/ui/textarea";
import {
	PlusIcon,
	TrashIcon,
	QuestionMarkCircleIcon,
	Bars3Icon,
} from "@heroicons/react/24/outline";
import {
	useFieldArray,
	useFormContext,
	useWatch,
	type FieldArrayWithId,
	type Control,
} from "react-hook-form";
import { cn } from "@community/lib-shared/utils";

import type { EventFormData, Question } from "./types";

interface QuestionsModalProps {
	control?: Control<EventFormData>;
	questions: Question[];
	children: React.ReactNode;
}

const OPTION_TYPES: Array<Question["type"]> = ["SELECT", "CHECKBOX", "RADIO"];

type QuestionField = FieldArrayWithId<EventFormData, "questions", "id"> &
	Partial<Question>;

export function QuestionsModal({
	control,
	questions: _questions,
	children,
}: QuestionsModalProps) {
	const [open, setOpen] = useState(false);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const formContext = useFormContext<EventFormData>();
	const formControl = control ?? formContext?.control;

	if (!formControl || !formContext) {
		throw new Error("QuestionsModal must be used within a form provider");
	}

	const { setValue, getValues } = formContext;

	const questionFields = useFieldArray<EventFormData, "questions">({
		control: formControl,
		name: "questions",
	});

	const watchedQuestions =
		(useWatch<EventFormData, "questions">({
			control: formControl,
			name: "questions",
		}) as Question[] | undefined) || [];

	const mergedQuestions: QuestionField[] = questionFields.fields.map(
		(field, index) => ({
			...field,
			...(watchedQuestions[index] ?? {}),
		}),
	);

	const questionsToRender: QuestionField[] = mergedQuestions.length
		? mergedQuestions
		: (watchedQuestions.map((question, index) => ({
				...question,
				id: questionFields.fields[index]?.id ?? index.toString(),
			})) as QuestionField[]);

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
	};

	const ensureOrder = () => {
		const currentQuestions = getValues("questions") || [];
		currentQuestions.forEach((_, index) => {
			setValue(`questions.${index}.order` as any, index, {
				shouldDirty: true,
				shouldTouch: true,
			});
		});
	};

	const handleDragStart = (e: React.DragEvent, index: number) => {
		setDraggedItem(index);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", "");
	};

	const handleDragOver = (e: React.DragEvent, index: number) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
		setDragOverIndex(index);
	};

	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	const handleDrop = (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault();
		setDragOverIndex(null);

		if (draggedItem === null || draggedItem === dropIndex) {
			setDraggedItem(null);
			return;
		}

		questionFields.move(draggedItem, dropIndex);
		setDraggedItem(null);
		ensureOrder();
	};

	const handleDragEnd = () => {
		setDraggedItem(null);
		setDragOverIndex(null);
	};

	const addNewQuestion = () => {
		questionFields.append({
			question: "",
			description: "",
			type: "TEXT",
			required: false,
			options: [],
			order: questionsToRender.length,
		});
		ensureOrder();
	};

	const removeQuestion = (index: number) => {
		questionFields.remove(index);
		ensureOrder();
	};

	const updateQuestion = <K extends keyof Question>(
		index: number,
		field: K,
		value: Question[K],
	) => {
		setValue(`questions.${index}.${field as string}` as any, value, {
			shouldDirty: true,
			shouldTouch: true,
		});

		if (
			field === "type" &&
			!OPTION_TYPES.includes(value as Question["type"])
		) {
			setValue(`questions.${index}.options` as any, [], {
				shouldDirty: true,
				shouldTouch: true,
			});
		}
	};

	const updateOptions = (
		questionIndex: number,
		optionIndex: number,
		value: string,
	) => {
		const currentOptions =
			(getValues(
				`questions.${questionIndex}.options` as any,
			) as string[]) || [];
		const nextOptions = [...currentOptions];
		nextOptions[optionIndex] = value;
		setValue(`questions.${questionIndex}.options` as any, nextOptions, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const addOption = (questionIndex: number) => {
		const currentOptions =
			(getValues(
				`questions.${questionIndex}.options` as any,
			) as string[]) || [];
		setValue(
			`questions.${questionIndex}.options` as any,
			[...currentOptions, ""],
			{
				shouldDirty: true,
				shouldTouch: true,
			},
		);
	};

	const removeOption = (questionIndex: number, optionIndex: number) => {
		const currentOptions =
			(getValues(
				`questions.${questionIndex}.options` as any,
			) as string[]) || [];
		const nextOptions = currentOptions.filter(
			(_, idx) => idx !== optionIndex,
		);
		setValue(`questions.${questionIndex}.options` as any, nextOptions, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto focus:outline-none">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<QuestionMarkCircleIcon className="w-5 h-5" />
						自定义报名问题
					</DialogTitle>
					<DialogDescription>
						收集报名者的额外信息，帮助更好了解参与者
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{questionsToRender.length === 0 && (
						<div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
							<QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
							<p className="text-sm">还没有自定义问题</p>
							<p className="text-xs mt-1">
								添加问题来收集参与者的额外信息
							</p>
						</div>
					)}

					{questionsToRender.map(
						(question: QuestionField, index: number) => {
							const isDragging = draggedItem === index;
							const isDragOver = dragOverIndex === index;
							const options = question.options || [];

							return (
								<div
									key={question.id || `question-${index}`}
									className={cn(
										"border rounded-lg p-4 space-y-4 transition-all",
										{
											"opacity-50": isDragging,
											"border-primary bg-muted":
												isDragOver && !isDragging,
											"hover:border-border": !isDragging,
										},
									)}
									draggable
									onDragStart={(e) =>
										handleDragStart(e, index)
									}
									onDragOver={(e) => handleDragOver(e, index)}
									onDragLeave={handleDragLeave}
									onDrop={(e) => handleDrop(e, index)}
									onDragEnd={handleDragEnd}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Bars3Icon
												className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing"
												title="拖拽排序"
											/>
											<span className="text-sm font-medium text-muted-foreground">
												问题 {index + 1}
											</span>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												removeQuestion(index)
											}
											className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
										>
											<TrashIcon className="w-4 h-4" />
										</Button>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-medium">
												问题标题
											</Label>
											<div className="flex items-center gap-2">
												<Checkbox
													checked={
														!!question.required
													}
													onCheckedChange={(
														checked,
													) =>
														updateQuestion(
															index,
															"required",
															checked === true,
														)
													}
												/>
												<Label className="text-sm">
													必填
												</Label>
											</div>
										</div>
										<Input
											placeholder="请输入问题内容..."
											value={question.question || ""}
											onChange={(e) =>
												updateQuestion(
													index,
													"question",
													e.target.value,
												)
											}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-medium">
											问题描述（可选）
										</Label>
										<Textarea
											placeholder="为参与者提供更详细的问题说明..."
											rows={2}
											value={question.description || ""}
											onChange={(e) =>
												updateQuestion(
													index,
													"description",
													e.target.value,
												)
											}
										/>
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-medium">
											问题类型
										</Label>
										<Select
											value={question.type || "TEXT"}
											onValueChange={(value) =>
												updateQuestion(
													index,
													"type",
													value as Question["type"],
												)
											}
										>
											<SelectTrigger className="w-48">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="TEXT">
													单行文本
												</SelectItem>
												<SelectItem value="TEXTAREA">
													多行文本
												</SelectItem>
												<SelectItem value="SELECT">
													下拉选择
												</SelectItem>
												<SelectItem value="CHECKBOX">
													多选框
												</SelectItem>
												<SelectItem value="RADIO">
													单选框
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{OPTION_TYPES.includes(
										(question.type ||
											"TEXT") as Question["type"],
									) && (
										<div className="space-y-2">
											<Label className="text-sm font-medium">
												选项设置
											</Label>
											<div className="space-y-2">
												{options.map(
													(
														option: string,
														optionIndex: number,
													) => (
														<div
															key={`option-${question.id || index}-${optionIndex}`}
															className="flex gap-2"
														>
															<Input
																placeholder={`选项 ${optionIndex + 1}`}
																value={option}
																onChange={(e) =>
																	updateOptions(
																		index,
																		optionIndex,
																		e.target
																			.value,
																	)
																}
															/>
															<Button
																variant="ghost"
																size="sm"
																onClick={() =>
																	removeOption(
																		index,
																		optionIndex,
																	)
																}
																className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0 flex-shrink-0"
															>
																<TrashIcon className="w-4 h-4" />
															</Button>
														</div>
													),
												)}
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														addOption(index)
													}
													className="w-full"
												>
													<PlusIcon className="w-4 h-4 mr-2" />
													添加选项
												</Button>
											</div>
										</div>
									)}
								</div>
							);
						},
					)}

					<Button
						variant="outline"
						onClick={addNewQuestion}
						className="w-full border-dashed hover:bg-muted hover:border-border"
					>
						<PlusIcon className="w-4 h-4 mr-2" />
						添加问题
					</Button>

					{/* <div className="flex justify-end gap-3 pt-6 border-t">
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							关闭
						</Button>
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function QuestionsSummary({ questions }: { questions: Question[] }) {
	if (questions.length === 0) {
		return (
			<div className="text-sm text-muted-foreground flex items-center gap-2">
				<QuestionMarkCircleIcon className="w-4 h-4 opacity-50" />
				仅收集基本信息
			</div>
		);
	}

	const sortedQuestions = [...questions].sort(
		(a, b) => (a.order || 0) - (b.order || 0),
	);

	return (
		<div className="space-y-2">
			<div className="text-sm font-medium flex items-center gap-2">
				<QuestionMarkCircleIcon className="w-4 h-4 text-blue-500" />
				{questions.length} 个自定义问题
			</div>
			<div className="space-y-1">
				{sortedQuestions.slice(0, 3).map((question, index) => (
					<div
						key={index}
						className="text-sm text-muted-foreground flex items-center gap-2"
					>
						<span className="text-xs text-muted-foreground">
							{index + 1}.
						</span>
						<span className="truncate">
							{question.question || `问题 ${index + 1}`}
						</span>
						{question.required && (
							<span className="text-xs text-red-500 flex-shrink-0">
								*
							</span>
						)}
					</div>
				))}
				{questions.length > 3 && (
					<div className="text-xs text-muted-foreground pl-5">
						... 还有 {questions.length - 3} 个问题
					</div>
				)}
			</div>
		</div>
	);
}
