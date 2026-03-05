"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Checkbox } from "@community/ui/ui/checkbox";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { Textarea } from "@community/ui/ui/textarea";

export interface EventSeriesFormOrganization {
	id: string;
	name: string;
}

export interface EventSeriesFormValues {
	title: string;
	slug: string;
	description: string;
	richContent: string;
	coverImage: string;
	logoImage: string;
	tags: string;
	organizationId: string;
	isActive: boolean;
}

export interface EventSeriesSubmitPayload {
	title: string;
	slug?: string;
	description?: string;
	richContent?: string;
	coverImage?: string;
	logoImage?: string;
	tags: string[];
	organizationId: string | null;
	isActive: boolean;
}

interface EventSeriesFormProps {
	mode: "create" | "edit";
	organizations: EventSeriesFormOrganization[];
	initialValues?: Partial<EventSeriesFormValues>;
	isSubmitting?: boolean;
	onSubmit: (payload: EventSeriesSubmitPayload) => void;
	onCancel: () => void;
}

const DEFAULT_VALUES: EventSeriesFormValues = {
	title: "",
	slug: "",
	description: "",
	richContent: "",
	coverImage: "",
	logoImage: "",
	tags: "",
	organizationId: "none",
	isActive: true,
};

export function EventSeriesForm({
	mode,
	organizations,
	initialValues,
	isSubmitting = false,
	onSubmit,
	onCancel,
}: EventSeriesFormProps) {
	const mergedInitialValues = useMemo(
		() => ({
			...DEFAULT_VALUES,
			...initialValues,
		}),
		[initialValues],
	);
	const [values, setValues] =
		useState<EventSeriesFormValues>(mergedInitialValues);

	useEffect(() => {
		setValues(mergedInitialValues);
	}, [mergedInitialValues]);

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSubmit({
					title: values.title.trim(),
					slug: values.slug.trim() || undefined,
					description: values.description.trim() || undefined,
					richContent: values.richContent.trim() || undefined,
					coverImage: values.coverImage.trim() || undefined,
					logoImage: values.logoImage.trim() || undefined,
					tags: values.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean),
					organizationId:
						values.organizationId === "none"
							? null
							: values.organizationId,
					isActive: values.isActive,
				});
			}}
			className="space-y-6"
		>
			<Card className="rounded-lg border border-border shadow-subtle">
				<CardHeader className="border-b border-border/50 pb-3">
					<CardTitle className="font-brand text-xl">
						{mode === "create" ? "创建系列活动" : "编辑系列活动"}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 pt-4">
					<div className="space-y-2">
						<Label htmlFor="series-title">系列名称 *</Label>
						<Input
							id="series-title"
							required
							maxLength={120}
							value={values.title}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									title: event.target.value,
								}))
							}
							placeholder="例如：AI 创业每周分享"
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="series-slug">Slug（可选）</Label>
							<Input
								id="series-slug"
								value={values.slug}
								onChange={(event) =>
									setValues((current) => ({
										...current,
										slug: event.target.value,
									}))
								}
								placeholder="留空自动生成"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="series-org">归属主办方</Label>
							<Select
								value={values.organizationId}
								onValueChange={(nextValue) =>
									setValues((current) => ({
										...current,
										organizationId: nextValue,
									}))
								}
							>
								<SelectTrigger id="series-org">
									<SelectValue placeholder="选择归属（可选）" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">
										个人主办
									</SelectItem>
									{organizations.map((organization) => (
										<SelectItem
											key={organization.id}
											value={organization.id}
										>
											{organization.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="series-description">简介</Label>
						<Textarea
							id="series-description"
							value={values.description}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									description: event.target.value,
								}))
							}
							rows={3}
							placeholder="一句话介绍这个系列活动"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="series-rich-content">
							详细介绍（可选）
						</Label>
						<Textarea
							id="series-rich-content"
							value={values.richContent}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									richContent: event.target.value,
								}))
							}
							rows={6}
							placeholder="可用于介绍系列背景、常见议题、参与方式等"
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="series-cover">封面图 URL</Label>
							<Input
								id="series-cover"
								value={values.coverImage}
								onChange={(event) =>
									setValues((current) => ({
										...current,
										coverImage: event.target.value,
									}))
								}
								placeholder="https://..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="series-logo">Logo URL</Label>
							<Input
								id="series-logo"
								value={values.logoImage}
								onChange={(event) =>
									setValues((current) => ({
										...current,
										logoImage: event.target.value,
									}))
								}
								placeholder="https://..."
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="series-tags">标签（逗号分隔）</Label>
						<Input
							id="series-tags"
							value={values.tags}
							onChange={(event) =>
								setValues((current) => ({
									...current,
									tags: event.target.value,
								}))
							}
							placeholder="AI, 创业, 分享"
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="series-active"
							checked={values.isActive}
							onCheckedChange={(checked) =>
								setValues((current) => ({
									...current,
									isActive: Boolean(checked),
								}))
							}
						/>
						<Label htmlFor="series-active">公开显示该系列</Label>
					</div>
				</CardContent>
			</Card>

			<div className="flex flex-wrap items-center justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					取消
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting || !values.title.trim()}
				>
					{isSubmitting
						? "提交中..."
						: mode === "create"
							? "创建系列"
							: "保存修改"}
				</Button>
			</div>
		</form>
	);
}
