"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import type {
	FeedbackQuestion,
	Answer,
} from "@/lib/database/prisma/types/feedback";

interface CustomFeedbackFieldProps {
	question: FeedbackQuestion;
	value: Answer | undefined;
	onChange: (value: Answer) => void;
	error?: string;
}

export function CustomFeedbackField({
	question,
	value,
	onChange,
	error,
}: CustomFeedbackFieldProps) {
	const [hoveredRating, setHoveredRating] = useState(0);

	const renderField = () => {
		switch (question.type) {
			case "text":
				return (
					<Input
						value={(value as string) || ""}
						onChange={(e) => onChange(e.target.value)}
						placeholder={question.placeholder || ""}
						maxLength={question.maxLength}
					/>
				);

			case "textarea":
				return (
					<div className="space-y-1">
						<Textarea
							value={(value as string) || ""}
							onChange={(e) => onChange(e.target.value)}
							placeholder={question.placeholder || ""}
							maxLength={question.maxLength}
							rows={4}
						/>
						{question.maxLength && (
							<p className="text-xs text-muted-foreground text-right">
								{((value as string) || "").length} /{" "}
								{question.maxLength}
							</p>
						)}
					</div>
				);

			case "rating": {
				const ratingValue = (value as number) || 0;
				return (
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 5].map((star) => {
							const isFilled =
								star <= (hoveredRating || ratingValue);
							return (
								<button
									key={star}
									type="button"
									onClick={() => onChange(star)}
									onMouseEnter={() => setHoveredRating(star)}
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
							{ratingValue > 0
								? `${ratingValue}/5`
								: "请选择评分"}
						</span>
					</div>
				);
			}

			case "yes_no":
				return (
					<div className="flex items-center gap-2">
						<Checkbox
							id={question.id}
							checked={(value as boolean) || false}
							onCheckedChange={(checked) =>
								onChange(checked as boolean)
							}
						/>
						<label
							htmlFor={question.id}
							className="text-sm font-medium cursor-pointer"
						>
							是
						</label>
					</div>
				);

			case "single_choice":
				return (
					<RadioGroup
						value={(value as string) || ""}
						onValueChange={(newValue) => onChange(newValue)}
					>
						{question.options?.map((option) => (
							<div
								key={option}
								className="flex items-center space-x-2"
							>
								<RadioGroupItem
									value={option}
									id={`${question.id}-${option}`}
								/>
								<Label
									htmlFor={`${question.id}-${option}`}
									className="cursor-pointer"
								>
									{option}
								</Label>
							</div>
						))}
					</RadioGroup>
				);

			case "multiple_choice": {
				const selectedValues = (value as string[]) || [];
				return (
					<div className="space-y-2">
						{question.options?.map((option) => (
							<div
								key={option}
								className="flex items-center space-x-2"
							>
								<Checkbox
									id={`${question.id}-${option}`}
									checked={selectedValues.includes(option)}
									onCheckedChange={(checked) => {
										if (checked) {
											onChange([
												...selectedValues,
												option,
											]);
										} else {
											onChange(
												selectedValues.filter(
													(v) => v !== option,
												),
											);
										}
									}}
								/>
								<label
									htmlFor={`${question.id}-${option}`}
									className="text-sm cursor-pointer"
								>
									{option}
								</label>
							</div>
						))}
					</div>
				);
			}

			default:
				return null;
		}
	};

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">
				{question.label}
				{question.required && (
					<span className="text-red-500 ml-1">*</span>
				)}
			</Label>
			{renderField()}
			{error && <p className="text-xs text-red-500">{error}</p>}
		</div>
	);
}
