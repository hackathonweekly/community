"use client";

import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@community/ui/ui/radio-group";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Textarea } from "@community/ui/ui/textarea";
import { useTranslations } from "next-intl";
import type { Question } from "./types";

interface QuestionsFormProps {
	questions: Question[];
	answers: Record<string, string>;
	onAnswerChange: (questionId: string, answer: string) => void;
}

export function QuestionsForm({
	questions,
	answers,
	onAnswerChange,
}: QuestionsFormProps) {
	const t = useTranslations("events.registration");

	if (questions.length === 0) {
		return null;
	}

	// Sort questions by order
	const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

	return (
		<div className="space-y-4">
			<Label className="text-base font-medium">
				{t("eventQuestions")}
			</Label>
			{sortedQuestions.map((question) => (
				<div key={question.id} className="space-y-2">
					<Label className="text-sm font-medium">
						{question.question}
						{question.required && (
							<span className="text-red-500 ml-1">
								{t("required")}
							</span>
						)}
					</Label>

					{question.description && (
						<p className="text-sm text-muted-foreground">
							{question.description}
						</p>
					)}

					{question.type === "TEXT" && (
						<Input
							value={answers[question.id] || ""}
							onChange={(e) =>
								onAnswerChange(question.id, e.target.value)
							}
							placeholder={t("answerPlaceholder")}
							required={question.required}
						/>
					)}

					{question.type === "TEXTAREA" && (
						<Textarea
							value={answers[question.id] || ""}
							onChange={(e) =>
								onAnswerChange(question.id, e.target.value)
							}
							placeholder={t("detailedAnswerPlaceholder")}
							rows={3}
							required={question.required}
						/>
					)}

					{question.type === "RADIO" && (
						<RadioGroup
							value={answers[question.id] || ""}
							onValueChange={(value) =>
								onAnswerChange(question.id, value)
							}
						>
							{question.options.map((option, index) => (
								<div
									key={index}
									className="flex items-center space-x-2"
								>
									<RadioGroupItem
										value={option}
										id={`${question.id}-${index}`}
									/>
									<Label htmlFor={`${question.id}-${index}`}>
										{option}
									</Label>
								</div>
							))}
						</RadioGroup>
					)}

					{question.type === "CHECKBOX" && (
						<div className="space-y-2">
							{question.options.map((option, index) => (
								<div
									key={index}
									className="flex items-center space-x-2"
								>
									<Checkbox
										id={`${question.id}-${index}`}
										checked={(
											answers[question.id] || ""
										).includes(option)}
										onCheckedChange={(checked) => {
											const currentAnswers = answers[
												question.id
											]
												? answers[question.id]
														.split(",")
														.filter(Boolean)
												: [];

											if (checked) {
												currentAnswers.push(option);
											} else {
												const index =
													currentAnswers.indexOf(
														option,
													);
												if (index > -1) {
													currentAnswers.splice(
														index,
														1,
													);
												}
											}

											onAnswerChange(
												question.id,
												currentAnswers.join(","),
											);
										}}
									/>
									<Label htmlFor={`${question.id}-${index}`}>
										{option}
									</Label>
								</div>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
