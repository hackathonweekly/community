import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ReactNode } from "react";

export interface EmailTemplateOption {
	value: string;
	label: string;
	defaultSubject?: string;
	defaultContent?: string;
	meta?: Record<string, unknown>;
}

interface EmailComposerFormProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	templates: EmailTemplateOption[];
	selectedTemplate: string;
	onTemplateSelect: (value: string, template?: EmailTemplateOption) => void;
	subject: string;
	onSubjectChange: (value: string) => void;
	content: string;
	onContentChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	extraHeader?: ReactNode;
	contentPlaceholder?: string;
}

export function EmailComposerForm({
	title,
	description,
	icon,
	templates,
	selectedTemplate,
	onTemplateSelect,
	subject,
	onSubjectChange,
	content,
	onContentChange,
	disabled = false,
	className,
	extraHeader,
	contentPlaceholder = "在这里输入邮件内容，支持 Markdown 格式...",
}: EmailComposerFormProps) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center">
					{icon ? (
						<span className="mr-2 flex items-center">{icon}</span>
					) : null}
					<span>{title}</span>
				</CardTitle>
				{description ? (
					<CardDescription>{description}</CardDescription>
				) : null}
				{extraHeader}
			</CardHeader>
			<CardContent className="space-y-4">
				<div>
					<Label htmlFor="template">邮件模板</Label>
					<Select
						value={selectedTemplate}
						onValueChange={(value) => {
							const template = templates.find(
								(item) => item.value === value,
							);
							onTemplateSelect(value, template);
						}}
						disabled={disabled}
					>
						<SelectTrigger id="template">
							<SelectValue placeholder="选择邮件模板" />
						</SelectTrigger>
						<SelectContent>
							{templates.map((template) => (
								<SelectItem
									key={template.value}
									value={template.value}
								>
									{template.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label htmlFor="subject">邮件主题</Label>
					<Input
						id="subject"
						placeholder="输入邮件主题"
						value={subject}
						onChange={(event) =>
							onSubjectChange(event.target.value)
						}
						disabled={disabled}
					/>
				</div>

				<div>
					<Label htmlFor="content">邮件内容 (Markdown)</Label>
					<Textarea
						id="content"
						placeholder={contentPlaceholder}
						value={content}
						onChange={(event) =>
							onContentChange(event.target.value)
						}
						disabled={disabled}
						rows={10}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
