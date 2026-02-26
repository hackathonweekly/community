"use client";

import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import type { SubmissionFormConfig } from "@/features/event-submissions/types";
import { FileText } from "lucide-react";
import { SubmissionFormConfigEditor } from "./SubmissionFormConfigEditor";

interface SubmissionFormConfigSectionProps {
	submissionFormConfig?: SubmissionFormConfig | null;
	onChange: (config: SubmissionFormConfig | null) => void;
	submissionsEnabled?: boolean;
}

interface SubmissionFormConfigSummaryProps {
	submissionFormConfig?: SubmissionFormConfig | null;
	submissionsEnabled?: boolean;
}

function SubmissionFormConfigSummary({
	submissionFormConfig,
	submissionsEnabled,
}: SubmissionFormConfigSummaryProps) {
	const normalizedFields =
		submissionFormConfig?.fields?.map((field) => ({
			...field,
			enabled: field.enabled ?? true,
			publicVisible: field.publicVisible ?? true,
		})) ?? [];
	const enabledFieldsCount = normalizedFields.filter(
		(field) => field.enabled !== false,
	).length;
	const requiredFieldsCount = normalizedFields.filter(
		(field) => field.enabled !== false && field.required,
	).length;
	const publicFieldsCount = normalizedFields.filter(
		(field) => field.enabled !== false && field.publicVisible !== false,
	).length;
	const baseFields = submissionFormConfig?.baseFields;
	const taglineEnabled = baseFields?.tagline?.enabled ?? true;
	const taglineRequired = baseFields?.tagline?.required ?? false;
	const demoUrlEnabled = baseFields?.demoUrl?.enabled ?? true;
	const demoUrlRequired = baseFields?.demoUrl?.required ?? false;
	const attachmentsEnabled =
		baseFields?.attachments?.enabled ??
		submissionFormConfig?.settings?.attachmentsEnabled ??
		true;
	const attachmentsRequired = baseFields?.attachments?.required ?? false;
	const authorizationEnabled =
		submissionFormConfig?.settings?.communityUseAuthorizationEnabled ??
		true;

	const fieldText =
		enabledFieldsCount > 0
			? `字段 ${enabledFieldsCount} 个（必填 ${requiredFieldsCount} · 公开 ${publicFieldsCount}）`
			: "使用默认字段";

	const baseFieldStateText = (enabled: boolean, required: boolean) => {
		if (!enabled) return "隐藏";
		return required ? "必填" : "选填";
	};

	const baseFieldText = `基础字段：介绍${baseFieldStateText(
		taglineEnabled,
		taglineRequired,
	)} · 链接${baseFieldStateText(demoUrlEnabled, demoUrlRequired)} · 附件${
		!attachmentsEnabled ? "隐藏" : attachmentsRequired ? "必填" : "选填"
	}`;
	const authorizationText = authorizationEnabled
		? "含宣传授权确认"
		: "不展示宣传授权";

	if (!submissionsEnabled) {
		return (
			<p className="text-sm text-muted-foreground">
				未开启作品提交 · {fieldText} · {baseFieldText}
			</p>
		);
	}

	return (
		<p className="text-sm text-muted-foreground">
			{fieldText} · {baseFieldText} · {authorizationText}
		</p>
	);
}

export function SubmissionFormConfigSection({
	submissionFormConfig,
	onChange,
	submissionsEnabled,
}: SubmissionFormConfigSectionProps) {
	return (
		<div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex items-start gap-3 min-w-0">
				<FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
				<div>
					<p className="font-medium">作品提交表单</p>
					<SubmissionFormConfigSummary
						submissionFormConfig={submissionFormConfig}
						submissionsEnabled={submissionsEnabled}
					/>
				</div>
			</div>

			<Dialog>
				<DialogTrigger asChild>
					<Button
						type="button"
						size="sm"
						variant="outline"
						className="shrink-0 w-full sm:w-auto"
					>
						编辑
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileText className="w-5 h-5" />
							作品提交表单配置
						</DialogTitle>
						<DialogDescription>
							配置参赛者提交作品时需要填写的额外字段，如智能体链接、演示视频等
						</DialogDescription>
					</DialogHeader>
					<SubmissionFormConfigEditor
						value={submissionFormConfig ?? null}
						onChange={onChange}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
