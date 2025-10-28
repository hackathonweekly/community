"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface SaveTemplateModalProps {
	isOpen: boolean;
	onClose: () => void;
	eventId: string;
}

export function SaveTemplateModal({
	isOpen,
	onClose,
	eventId,
}: SaveTemplateModalProps) {
	const [templateName, setTemplateName] = useState("");
	const [templateDescription, setTemplateDescription] = useState("");
	const [templateIsPublic, setTemplateIsPublic] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (!templateName.trim()) {
			toast.error("模板名称不能为空");
			return;
		}

		setIsSaving(true);
		try {
			const response = await fetch(
				`/api/event-templates/from-event/${eventId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: templateName,
						description: templateDescription,
						isPublic: templateIsPublic,
					}),
				},
			);

			if (response.ok) {
				toast.success("活动已成功保存为模板！");
				onClose();
				// Reset form
				setTemplateName("");
				setTemplateDescription("");
				setTemplateIsPublic(false);
			} else {
				const error = await response.json();
				toast.error(error.message || "保存模板失败");
			}
		} catch (error) {
			console.error("Error saving template:", error);
			toast.error("保存模板时发生错误");
		} finally {
			setIsSaving(false);
		}
	};

	const handleClose = () => {
		if (!isSaving) {
			onClose();
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>保存为模板</DialogTitle>
					<DialogDescription>
						将此活动保存为模板，方便以后快速创建类似活动
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="templateName">模板名称 *</Label>
						<Input
							id="templateName"
							value={templateName}
							onChange={(e) => setTemplateName(e.target.value)}
							placeholder="输入模板名称..."
							disabled={isSaving}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="templateDescription">模板描述</Label>
						<Textarea
							id="templateDescription"
							value={templateDescription}
							onChange={(e) =>
								setTemplateDescription(e.target.value)
							}
							placeholder="简单描述这个模板的用途..."
							rows={3}
							disabled={isSaving}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="templateIsPublic"
							checked={templateIsPublic}
							onCheckedChange={(checked) =>
								setTemplateIsPublic(checked as boolean)
							}
							disabled={isSaving}
						/>
						<Label htmlFor="templateIsPublic" className="text-sm">
							设为公开模板（其他用户也可以看到并使用）
						</Label>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isSaving}
					>
						取消
					</Button>
					<Button
						onClick={handleSave}
						disabled={isSaving || !templateName.trim()}
					>
						{isSaving ? "保存中..." : "保存模板"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
