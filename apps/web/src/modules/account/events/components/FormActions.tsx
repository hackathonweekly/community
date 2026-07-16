import { Button } from "@community/ui/ui/button";
import type { UseFormHandleSubmit } from "react-hook-form";
import { toast } from "sonner";
import type { EventFormData } from "./types";
import { getEventFormValidationMessages } from "./event-form-error-utils";

interface FormActionsProps {
	handleSubmit: UseFormHandleSubmit<EventFormData>;
	handleFormSubmit: (
		data: EventFormData,
		status?: "DRAFT" | "PUBLISHED",
	) => void;
	isLoading?: boolean;
	isEdit?: boolean;
	isEditMode?: boolean;
}

export function FormActions({
	handleSubmit,
	handleFormSubmit,
	isLoading = false,
	isEdit = false,
	isEditMode = false,
}: FormActionsProps) {
	const handleSaveDraft = () => {
		handleSubmit(
			(data) => {
				console.log("Saving as draft with data:", data);
				handleFormSubmit(data, "DRAFT");
			},
			(errors) => {
				console.error("Form validation errors (draft):", errors);
				const errorMessages = getEventFormValidationMessages(errors);
				toast.error(
					errorMessages.length > 0
						? `保存草稿失败：${errorMessages.slice(0, 3).join("；")}`
						: "保存草稿失败，请检查页面中的提示信息",
				);
			},
		)();
	};

	return (
		<div className="flex justify-end gap-4">
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
