"use client";

import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { HandHeart, Search, Edit, Plus, AlertCircle } from "lucide-react";

interface ResourceMatchingPreviewProps {
	whatICanOffer?: string | null;
	whatIAmLookingFor?: string | null;
	onManageResourceMatching: () => void;
}

const truncateText = (text: string | null | undefined, maxLength: number) => {
	if (!text) return "";
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

export function ResourceMatchingPreview({
	whatICanOffer,
	whatIAmLookingFor,
	onManageResourceMatching,
}: ResourceMatchingPreviewProps) {
	const hasInfo = whatICanOffer || whatIAmLookingFor;
	const missingInfo = [];

	if (!whatICanOffer) missingInfo.push("能提供的帮助");
	if (!whatIAmLookingFor) missingInfo.push("寻找的合作");

	if (!hasInfo) {
		return (
			<Card
				id="resource-matching"
				className="border-border bg-card shadow-sm dark:border-border dark:bg-card"
			>
				<CardHeader className="border-b border-border pb-3 dark:border-border">
					<CardTitle className="flex items-center justify-between text-base">
						<div className="flex items-center gap-2">
							<HandHeart className="h-4 w-4" />
							资源匹配
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onManageResourceMatching}
							className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
						>
							<Plus className="mr-1 h-3 w-3" />
							添加匹配信息
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					<div className="rounded-md bg-muted p-6 text-center dark:bg-secondary">
						<div className="space-y-3">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card dark:border-border dark:bg-card">
								<HandHeart className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-bold text-foreground">
									还没有填写资源匹配信息
								</p>
								<p className="text-xs text-muted-foreground dark:text-muted-foreground">
									描述您能提供的帮助和寻找的合作，促进资源互换
								</p>
							</div>
							<Button
								type="button"
								size="sm"
								onClick={onManageResourceMatching}
								className="mt-2 h-8 rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
							>
								<Plus className="mr-1 h-3 w-3" />
								添加匹配信息
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card
			id="resource-matching"
			className="border-border bg-card shadow-sm dark:border-border dark:bg-card"
		>
			<CardHeader className="border-b border-border pb-3 dark:border-border">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<HandHeart className="h-4 w-4" />
						资源匹配
						{missingInfo.length > 0 && (
							<span className="text-xs font-bold text-amber-600 dark:text-amber-300">
								(待完善)
							</span>
						)}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageResourceMatching}
						className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
					>
						<Edit className="mr-1 h-3 w-3" />
						编辑匹配
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-4">
				<div className="space-y-4">
					{whatICanOffer && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<HandHeart className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
								<label className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
									我能提供什么
								</label>
							</div>
							<p className="pl-6 text-sm leading-relaxed text-foreground">
								{truncateText(whatICanOffer, 100)}
							</p>
						</div>
					)}

					{whatIAmLookingFor && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Search className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
								<label className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
									我在寻找什么
								</label>
							</div>
							<p className="pl-6 text-sm leading-relaxed text-foreground">
								{truncateText(whatIAmLookingFor, 100)}
							</p>
						</div>
					)}

					{missingInfo.length > 0 && (
						<div className="mt-4 border-t border-border pt-3 dark:border-border">
							<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300">
								<AlertCircle className="h-3 w-3" />
								<span>还需完善：{missingInfo.join("、")}</span>
							</div>
						</div>
					)}

					<div className="mt-3 border-t border-border pt-3 dark:border-border">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageResourceMatching}
							className="h-auto p-0 text-xs font-bold text-muted-foreground hover:bg-transparent hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
						>
							查看和编辑完整资源匹配信息 →
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
