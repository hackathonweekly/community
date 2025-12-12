"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CogIcon, PlusIcon } from "@heroicons/react/24/outline";
import { X } from "lucide-react";
import { useState } from "react";

interface AdvancedSettingsModalProps {
	control: any;
	form: any;
	tags: string[];
	children: React.ReactNode;
}

export function AdvancedSettingsModal({
	control,
	form,
	tags,
	children,
}: AdvancedSettingsModalProps) {
	const [open, setOpen] = useState(false);
	const [newTag, setNewTag] = useState("");
	void control;
	const projectRequired = form.watch("requireProjectSubmission");
	const digitalCardConsent = form.watch("askDigitalCardConsent");

	const handleToggle = (field: string, value: boolean) => {
		form.setValue(field, value, { shouldDirty: true, shouldTouch: true });
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<CogIcon className="w-5 h-5" />
						高级设置
					</DialogTitle>
					<DialogDescription>
						配置标签、报名附加要求等高级功能
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* 标签设置 */}
					<div>
						<Label>标签</Label>
						<div className="flex flex-wrap gap-2 mb-2">
							{form
								.watch("tags")
								.map((tag: string, index: number) => (
									<Badge
										key={index}
										variant="secondary"
										className="flex items-center gap-1"
									>
										{tag}
										<X
											className="w-3 h-3 cursor-pointer"
											onClick={() => {
												const currentTags =
													form.getValues("tags");
												form.setValue(
													"tags",
													currentTags.filter(
														(
															_: string,
															i: number,
														) => i !== index,
													),
												);
											}}
										/>
									</Badge>
								))}
						</div>
						<div className="flex gap-2">
							<Input
								placeholder="添加标签"
								value={newTag}
								onChange={(e) => setNewTag(e.target.value)}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										if (
											newTag.trim() &&
											!form
												.getValues("tags")
												.includes(newTag.trim())
										) {
											form.setValue("tags", [
												...form.getValues("tags"),
												newTag.trim(),
											]);
											setNewTag("");
										}
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									if (
										newTag.trim() &&
										!form
											.getValues("tags")
											.includes(newTag.trim())
									) {
										form.setValue("tags", [
											...form.getValues("tags"),
											newTag.trim(),
										]);
										setNewTag("");
									}
								}}
							>
								<PlusIcon className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						<Label>报名附加要求</Label>
						<div className="space-y-2">
							<div className="flex items-start gap-3 rounded-md border px-3 py-2">
								<Checkbox
									checked={!!projectRequired}
									onCheckedChange={(checked) =>
										handleToggle(
											"requireProjectSubmission",
											!!checked,
										)
									}
									className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
								/>
								<div className="space-y-1">
									<p className="text-sm font-medium">
										需要作品关联
									</p>
									<p className="text-xs text-muted-foreground">
										要求报名者创建或关联一个项目，适用于
										Demo Day、Cowork 等活动
									</p>
								</div>
							</div>

							<div className="flex items-start gap-3 rounded-md border px-3 py-2">
								<Checkbox
									checked={!!digitalCardConsent}
									onCheckedChange={(checked) =>
										handleToggle(
											"askDigitalCardConsent",
											!!checked,
										)
									}
									className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
								/>
								<div className="space-y-1">
									<p className="text-sm font-medium">
										询问数字名片展示意愿
									</p>
									<p className="text-xs text-muted-foreground">
										开启后，报名时会询问用户是否愿意在 PPT
										模式中展示其数字名片信息
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* <div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							关闭
						</Button>
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function AdvancedSettingsSummary({
	tags,
	requireProjectSubmission,
	askDigitalCardConsent,
}: {
	tags: string[];
	requireProjectSubmission?: boolean;
	askDigitalCardConsent?: boolean;
}) {
	const hasAdvancedSettings =
		tags.length > 0 || requireProjectSubmission || askDigitalCardConsent;

	if (!hasAdvancedSettings) {
		return (
			<div className="text-sm text-muted-foreground">使用默认设置</div>
		);
	}

	return (
		<div className="space-y-2">
			{(requireProjectSubmission || askDigitalCardConsent) && (
				<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
					{requireProjectSubmission && (
						<Badge variant="outline" className="text-xs">
							需要作品关联
						</Badge>
					)}
					{askDigitalCardConsent && (
						<Badge variant="outline" className="text-xs">
							询问数字名片展示
						</Badge>
					)}
				</div>
			)}

			{tags.length > 0 && (
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">标签:</span>
					<div className="flex flex-wrap gap-1">
						{tags.slice(0, 3).map((tag, index) => (
							<Badge
								key={index}
								variant="outline"
								className="text-xs"
							>
								{tag}
							</Badge>
						))}
						{tags.length > 3 && (
							<Badge variant="outline" className="text-xs">
								+{tags.length - 3}
							</Badge>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
