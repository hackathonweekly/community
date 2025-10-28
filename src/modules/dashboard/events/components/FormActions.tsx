import { Button } from "@/components/ui/button";
import type { UseFormHandleSubmit } from "react-hook-form";
import type { EventFormData } from "./types";
import { toast } from "sonner";

interface FormActionsProps {
	onSubmit: (data: any, status?: "DRAFT" | "PUBLISHED") => void;
	onSaveAsTemplate?: (data: any) => void;
	handleSubmit: UseFormHandleSubmit<EventFormData>;
	handleFormSubmit: (
		data: EventFormData,
		status?: "DRAFT" | "PUBLISHED",
	) => void;
	isLoading?: boolean;
	isEdit?: boolean;
	isEditMode?: boolean;
	hideTemplateAction?: boolean;
}

export function FormActions({
	onSubmit,
	onSaveAsTemplate,
	handleSubmit,
	handleFormSubmit,
	isLoading = false,
	isEdit = false,
	isEditMode = false,
	hideTemplateAction = false,
}: FormActionsProps) {
	const handleSaveAsTemplate = () => {
		handleSubmit(
			(data) => {
				console.log("Saving as template with data:", data);
				onSaveAsTemplate?.(data);
			},
			(errors) => {
				console.error("Form validation errors (template):", errors);
				// 显示具体的验证错误
				const errorMessages = Object.entries(errors)
					.map(([field, error]) => {
						const fieldName =
							{
								title: "活动标题",
								richContent: "活动详情",
								startTime: "开始时间",
								endTime: "结束时间",
								location: "活动地点",
							}[field] || field;
						return `${fieldName}: ${error?.message || "验证失败"}`;
					})
					.join("\n");
				toast.error(`保存模板失败，请完善以下字段：\n${errorMessages}`);
			},
		)();
	};

	const handleSaveDraft = () => {
		handleSubmit(
			(data) => {
				console.log("Saving as draft with data:", data);
				handleFormSubmit(data, "DRAFT");
			},
			(errors) => {
				console.error("Form validation errors (draft):", errors);
				// 显示具体的验证错误
				const errorMessages = Object.entries(errors)
					.map(([field, error]) => {
						const fieldName =
							{
								title: "活动标题",
								richContent: "活动详情",
								startTime: "开始时间",
								endTime: "结束时间",
								location: "活动地点",
							}[field] || field;
						return `${fieldName}: ${error?.message || "验证失败"}`;
					})
					.join("\n");
				toast.error(`保存草稿失败，请完善以下字段：\n${errorMessages}`);
			},
		)();
	};

	return (
		<div className="flex justify-end gap-4">
			{onSaveAsTemplate && !hideTemplateAction && (
				<Button
					type="button"
					variant="secondary"
					disabled={isLoading}
					onClick={handleSaveAsTemplate}
				>
					保存为模板
				</Button>
			)}
			<Button
				type="button"
				variant="outline"
				disabled={isLoading}
				onClick={handleSaveDraft}
			>
				{isLoading ? "保存中..." : "保存草稿"}
			</Button>
			<Button type="submit" disabled={isLoading}>
				{isLoading
					? isEditMode
						? "更新中..."
						: "发布中..."
					: isEditMode
						? "更新模板"
						: isEdit
							? "更新活动"
							: "发布活动"}
			</Button>
		</div>
	);
}
