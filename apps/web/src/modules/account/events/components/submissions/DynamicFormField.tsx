"use client";

import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { RadioGroup, RadioGroupItem } from "@community/ui/ui/radio-group";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Label } from "@community/ui/ui/label";
import type { SubmissionFormField } from "@/features/event-submissions/types";
import type { Control } from "react-hook-form";
import { ImageUploader } from "./ImageUploader";
import { FileUploader } from "./FileUploader";

interface DynamicFormFieldProps {
	field: SubmissionFormField;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	control: Control<any>;
	eventId: string;
}

export function DynamicFormField({
	field,
	control,
	eventId,
}: DynamicFormFieldProps) {
	const fieldName = `customFields.${field.key}` as const;

	return (
		<FormField
			control={control}
			name={fieldName}
			render={({ field: formField }) => (
				<FormItem>
					<FormLabel>
						{field.label}
						{field.required && (
							<span className="text-red-500 ml-1">*</span>
						)}
					</FormLabel>
					<FormControl>
						{renderFieldInput(field, formField, eventId)}
					</FormControl>
					{field.description && (
						<FormDescription>{field.description}</FormDescription>
					)}
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function renderFieldInput(
	fieldConfig: SubmissionFormField,
	formField: any,
	eventId: string,
) {
	switch (fieldConfig.type) {
		case "text":
			return (
				<Input
					placeholder={fieldConfig.placeholder}
					{...formField}
					value={formField.value || ""}
				/>
			);

		case "textarea":
			return (
				<Textarea
					placeholder={fieldConfig.placeholder}
					className="min-h-[100px]"
					{...formField}
					value={formField.value || ""}
				/>
			);

		case "url":
			return (
				<Input
					type="url"
					placeholder={fieldConfig.placeholder || "https://"}
					{...formField}
					value={formField.value || ""}
				/>
			);

		case "phone":
			return (
				<Input
					type="tel"
					placeholder={fieldConfig.placeholder || "请输入手机号码"}
					{...formField}
					value={formField.value || ""}
				/>
			);

		case "email":
			return (
				<Input
					type="email"
					placeholder={fieldConfig.placeholder || "请输入邮箱地址"}
					{...formField}
					value={formField.value || ""}
				/>
			);

		case "select":
			return (
				<Select
					onValueChange={formField.onChange}
					value={formField.value || ""}
				>
					<SelectTrigger>
						<SelectValue
							placeholder={fieldConfig.placeholder || "请选择"}
						/>
					</SelectTrigger>
					<SelectContent>
						{fieldConfig.options?.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);

		case "radio":
			return (
				<RadioGroup
					onValueChange={formField.onChange}
					value={formField.value || ""}
					className="flex flex-col space-y-2"
				>
					{fieldConfig.options?.map((option) => (
						<div
							key={option}
							className="flex items-center space-x-2"
						>
							<RadioGroupItem
								value={option}
								id={`${fieldConfig.key}-${option}`}
							/>
							<Label htmlFor={`${fieldConfig.key}-${option}`}>
								{option}
							</Label>
						</div>
					))}
				</RadioGroup>
			);

		case "checkbox":
			return (
				<div className="flex flex-col space-y-2">
					{fieldConfig.options?.map((option) => (
						<div
							key={option}
							className="flex items-center space-x-2"
						>
							<Checkbox
								id={`${fieldConfig.key}-${option}`}
								checked={(formField.value || []).includes(
									option,
								)}
								onCheckedChange={(checked) => {
									const currentValue = formField.value || [];
									if (checked) {
										formField.onChange([
											...currentValue,
											option,
										]);
									} else {
										formField.onChange(
											currentValue.filter(
												(v: string) => v !== option,
											),
										);
									}
								}}
							/>
							<Label htmlFor={`${fieldConfig.key}-${option}`}>
								{option}
							</Label>
						</div>
					))}
				</div>
			);

		case "image":
			return (
				<ImageUploader
					eventId={eventId}
					value={formField.value || ""}
					onChange={formField.onChange}
					placeholder={fieldConfig.placeholder}
				/>
			);

		case "file":
			return (
				<FileUploader
					eventId={eventId}
					value={formField.value || ""}
					onChange={formField.onChange}
					placeholder={fieldConfig.placeholder}
				/>
			);

		default:
			return (
				<Input
					placeholder={fieldConfig.placeholder}
					{...formField}
					value={formField.value || ""}
				/>
			);
	}
}
