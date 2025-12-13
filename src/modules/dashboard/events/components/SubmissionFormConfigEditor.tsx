"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Plus,
	Trash2,
	GripVertical,
	ChevronUp,
	ChevronDown,
	ImagePlus,
	Video,
	Code,
} from "lucide-react";
import type {
	SubmissionFormConfig,
	SubmissionFormField,
	SubmissionFieldType,
} from "@/features/event-submissions/types";

interface SubmissionFormConfigEditorProps {
	value: SubmissionFormConfig | null;
	onChange: (config: SubmissionFormConfig | null) => void;
}

const FIELD_TYPES: { value: SubmissionFieldType; label: string }[] = [
	{ value: "text", label: "单行文本" },
	{ value: "textarea", label: "多行文本" },
	{ value: "url", label: "链接" },
	{ value: "phone", label: "电话号码" },
	{ value: "email", label: "邮箱" },
	{ value: "image", label: "图片上传" },
	{ value: "file", label: "文件上传" },
	{ value: "select", label: "下拉选择" },
	{ value: "radio", label: "单选" },
	{ value: "checkbox", label: "多选" },
];

const DEFAULT_FIELD: Omit<SubmissionFormField, "key" | "order"> = {
	label: "",
	type: "text",
	required: false,
	placeholder: "",
	description: "",
};

const DEFAULT_SETTINGS = {
	attachmentsEnabled: true,
	communityUseAuthorizationEnabled: true,
};

// 预设字段模板
const PRESET_FIELDS: Record<
	string,
	Omit<SubmissionFormField, "key" | "order">
> = {
	teamPhoto: {
		label: "团队照片",
		type: "image",
		required: false,
		placeholder: "上传团队合照",
		description: "请上传团队合照，用于活动宣传展示",
	},
	demoVideo: {
		label: "演示视频",
		type: "url",
		required: false,
		placeholder: "https://",
		description: "请提供作品演示视频链接（如 B站、YouTube 等）",
	},
	sourceCode: {
		label: "源代码链接",
		type: "url",
		required: false,
		placeholder: "https://github.com/...",
		description: "请提供项目的 GitHub 或其他代码托管平台链接",
	},
};

export function SubmissionFormConfigEditor({
	value,
	onChange,
}: SubmissionFormConfigEditorProps) {
	const fields = value?.fields || [];
	const settings = {
		...DEFAULT_SETTINGS,
		...(value?.settings ?? {}),
	};

	const commitConfig = (
		nextFields: SubmissionFormField[],
		nextSettings:
			| SubmissionFormConfig["settings"]
			| undefined = value?.settings,
	) => {
		const hasFields = nextFields.length > 0;
		const hasSettings = !!nextSettings;

		if (!hasFields && !hasSettings) {
			onChange(null);
			return;
		}

		onChange({
			...(hasFields ? { fields: nextFields } : { fields: [] }),
			...(nextSettings ? { settings: nextSettings } : {}),
		});
	};

	const updateConfig = (nextFields: SubmissionFormField[]) => {
		commitConfig(nextFields, value?.settings);
	};

	const addField = () => {
		const newField: SubmissionFormField = {
			...DEFAULT_FIELD,
			key: `field_${Date.now()}`,
			order: fields.length,
		};
		updateConfig([...fields, newField]);
	};

	const addPresetField = (presetKey: string) => {
		const preset = PRESET_FIELDS[presetKey];
		if (!preset) return;

		// Check if field with same key already exists
		if (fields.some((f) => f.key === presetKey)) {
			return; // Already exists
		}

		const newField: SubmissionFormField = {
			...preset,
			key: presetKey,
			order: fields.length,
		};
		updateConfig([...fields, newField]);
	};

	const updateField = (
		index: number,
		updates: Partial<SubmissionFormField>,
	) => {
		const newFields = [...fields];
		newFields[index] = { ...newFields[index], ...updates };
		updateConfig(newFields);
	};

	const handleTypeChange = (index: number, type: SubmissionFieldType) => {
		const current = fields[index];
		if (!current) return;

		const updates: Partial<SubmissionFormField> = { type };

		if (needsOptions(type) && !current.options) {
			updates.options = [];
		}

		updateField(index, updates);
	};

	const removeField = (index: number) => {
		const newFields = fields
			.filter((_, i) => i !== index)
			.map((field, i) => ({ ...field, order: i }));
		updateConfig(newFields);
	};

	const moveField = (index: number, direction: "up" | "down") => {
		if (
			(direction === "up" && index === 0) ||
			(direction === "down" && index === fields.length - 1)
		) {
			return;
		}

		const newFields = [...fields];
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		[newFields[index], newFields[targetIndex]] = [
			newFields[targetIndex],
			newFields[index],
		];
		// Update order
		newFields.forEach((field, i) => {
			field.order = i;
		});
		updateConfig(newFields);
	};

	const needsOptions = (type: SubmissionFieldType) =>
		["select", "radio", "checkbox"].includes(type);

	const addOption = (fieldIndex: number) => {
		const targetField = fields[fieldIndex];
		if (!targetField) return;

		const options = [...(targetField.options || [])];
		options.push("");
		updateField(fieldIndex, { options });
	};

	const updateOption = (
		fieldIndex: number,
		optionIndex: number,
		value: string,
	) => {
		const targetField = fields[fieldIndex];
		if (!targetField) return;

		const options = [...(targetField.options || [])];
		options[optionIndex] = value;
		updateField(fieldIndex, { options });
	};

	const removeOption = (fieldIndex: number, optionIndex: number) => {
		const targetField = fields[fieldIndex];
		if (!targetField) return;

		const options =
			targetField.options?.filter((_, idx) => idx !== optionIndex) || [];
		updateField(fieldIndex, { options });
	};

	const updateSettings = (updates: Partial<typeof DEFAULT_SETTINGS>) => {
		const nextSettings = { ...settings, ...updates };
		commitConfig(fields, nextSettings);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>自定义提交字段</CardTitle>
				<CardDescription>
					配置作品提交时需要收集的额外信息。这些字段将显示在基础信息之后。
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div className="space-y-1">
							<p className="font-medium">附件上传</p>
							<p className="text-sm text-muted-foreground">
								控制是否在提交表单展示附件上传区域
							</p>
						</div>
						<Switch
							checked={settings.attachmentsEnabled}
							onCheckedChange={(checked) =>
								updateSettings({ attachmentsEnabled: checked })
							}
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border p-3">
						<div className="space-y-1">
							<p className="font-medium">宣传授权确认</p>
							<p className="text-sm text-muted-foreground">
								可选，关闭后不再展示“是否授权用于宣传”问题
							</p>
						</div>
						<Switch
							checked={settings.communityUseAuthorizationEnabled}
							onCheckedChange={(checked) =>
								updateSettings({
									communityUseAuthorizationEnabled: checked,
								})
							}
						/>
					</div>
				</div>

				{fields.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<p>暂无自定义字段</p>
						<p className="text-sm">点击下方按钮添加字段</p>
					</div>
				) : (
					<Accordion type="multiple" className="space-y-2">
						{fields.map((field, index) => (
							<AccordionItem
								key={field.key}
								value={field.key}
								className="border rounded-lg px-4"
							>
								<AccordionTrigger className="hover:no-underline">
									<div className="flex items-center gap-2 flex-1">
										<GripVertical className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">
											{field.label || "未命名字段"}
										</span>
										<span className="text-xs text-muted-foreground">
											(
											{
												FIELD_TYPES.find(
													(t) =>
														t.value === field.type,
												)?.label
											}
											)
										</span>
										{field.required && (
											<span className="text-xs text-red-500">
												必填
											</span>
										)}
									</div>
								</AccordionTrigger>
								<AccordionContent className="space-y-4 pt-4">
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>字段标识 (key)</Label>
											<Input
												value={field.key}
												onChange={(e) =>
													updateField(index, {
														key: e.target.value.replace(
															/\s/g,
															"_",
														),
													})
												}
												placeholder="如: agentName"
											/>
											<p className="text-xs text-muted-foreground">
												英文标识，用于数据存储
											</p>
										</div>
										<div className="space-y-2">
											<Label>显示名称</Label>
											<Input
												value={field.label}
												onChange={(e) =>
													updateField(index, {
														label: e.target.value,
													})
												}
												placeholder="如: 智能体名称"
											/>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>字段类型</Label>
											<Select
												value={field.type}
												onValueChange={(
													value: SubmissionFieldType,
												) =>
													handleTypeChange(
														index,
														value,
													)
												}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{FIELD_TYPES.map((type) => (
														<SelectItem
															key={type.value}
															value={type.value}
														>
															{type.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>占位提示</Label>
											<Input
												value={field.placeholder || ""}
												onChange={(e) =>
													updateField(index, {
														placeholder:
															e.target.value,
													})
												}
												placeholder="输入框提示文字"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label>字段说明</Label>
										<Textarea
											value={field.description || ""}
											onChange={(e) =>
												updateField(index, {
													description: e.target.value,
												})
											}
											placeholder="帮助用户理解该字段的说明文字"
											rows={2}
										/>
									</div>

									{needsOptions(field.type) && (
										<div className="space-y-2">
											<Label>选项列表</Label>
											<div className="space-y-2">
												{(field.options || [])
													.length === 0 && (
													<p className="text-sm text-muted-foreground">
														还没有选项，点击下方按钮添加
													</p>
												)}
												{(field.options || []).map(
													(option, optionIndex) => (
														<div
															key={`${field.key}-option-${optionIndex}`}
															className="flex items-center gap-2"
														>
															<Input
																value={option}
																onChange={(e) =>
																	updateOption(
																		index,
																		optionIndex,
																		e.target
																			.value,
																	)
																}
																placeholder={`选项 ${optionIndex + 1}`}
															/>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																onClick={() =>
																	removeOption(
																		index,
																		optionIndex,
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													),
												)}
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() =>
														addOption(index)
													}
													className="w-full sm:w-auto"
												>
													<Plus className="h-4 w-4 mr-2" />
													添加选项
												</Button>
											</div>
										</div>
									)}

									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-2">
											<Switch
												id={`required-${field.key}`}
												checked={field.required}
												onCheckedChange={(checked) =>
													updateField(index, {
														required: checked,
													})
												}
											/>
											<Label
												htmlFor={`required-${field.key}`}
											>
												必填
											</Label>
										</div>

										<div className="flex items-center gap-2">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() =>
													moveField(index, "up")
												}
												disabled={index === 0}
											>
												<ChevronUp className="h-4 w-4" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() =>
													moveField(index, "down")
												}
												disabled={
													index === fields.length - 1
												}
											>
												<ChevronDown className="h-4 w-4" />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() =>
													removeField(index)
												}
												className="text-destructive hover:text-destructive"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				)}

				{/* 快捷添加预设字段 */}
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						快速添加常用字段：
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => addPresetField("teamPhoto")}
							disabled={fields.some((f) => f.key === "teamPhoto")}
						>
							<ImagePlus className="h-4 w-4 mr-2" />
							团队照片
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => addPresetField("demoVideo")}
							disabled={fields.some((f) => f.key === "demoVideo")}
						>
							<Video className="h-4 w-4 mr-2" />
							演示视频
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => addPresetField("sourceCode")}
							disabled={fields.some(
								(f) => f.key === "sourceCode",
							)}
						>
							<Code className="h-4 w-4 mr-2" />
							源代码链接
						</Button>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					onClick={addField}
					className="w-full"
				>
					<Plus className="h-4 w-4 mr-2" />
					添加字段
				</Button>
			</CardContent>
		</Card>
	);
}
