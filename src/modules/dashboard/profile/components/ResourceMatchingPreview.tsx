"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			<Card id="resource-matching">
				<CardHeader>
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
							className="h-8 text-xs"
						>
							<Plus className="h-3 w-3 mr-1" />
							添加匹配信息
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8 text-center">
						<div className="space-y-3">
							<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
								<HandHeart className="h-8 w-8 text-muted-foreground" />
							</div>
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">
									还没有填写资源匹配信息
								</p>
								<p className="text-xs text-muted-foreground">
									描述您能提供的帮助和寻找的合作，促进资源互换
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onManageResourceMatching}
								className="mt-3"
							>
								<Plus className="h-3 w-3 mr-1" />
								添加匹配信息
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card id="resource-matching">
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<HandHeart className="h-4 w-4" />
						资源匹配
						{missingInfo.length > 0 && (
							<span className="text-xs text-amber-600 font-normal">
								(待完善)
							</span>
						)}
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageResourceMatching}
						className="h-8 text-xs"
					>
						<Edit className="h-3 w-3 mr-1" />
						编辑匹配
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{whatICanOffer && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<HandHeart className="h-4 w-4 text-primary" />
								<label className="text-xs font-medium text-muted-foreground">
									我能提供什么
								</label>
							</div>
							<p className="text-sm leading-relaxed pl-6">
								{truncateText(whatICanOffer, 100)}
							</p>
						</div>
					)}

					{whatIAmLookingFor && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<Search className="h-4 w-4 text-primary" />
								<label className="text-xs font-medium text-muted-foreground">
									我在寻找什么
								</label>
							</div>
							<p className="text-sm leading-relaxed pl-6">
								{truncateText(whatIAmLookingFor, 100)}
							</p>
						</div>
					)}

					{missingInfo.length > 0 && (
						<div className="mt-4 pt-3 border-t">
							<div className="flex items-center gap-2 text-xs text-amber-600">
								<AlertCircle className="h-3 w-3" />
								<span>还需完善：{missingInfo.join("、")}</span>
							</div>
						</div>
					)}

					<div className="mt-3 pt-3 border-t">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={onManageResourceMatching}
							className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
						>
							查看和编辑完整资源匹配信息 →
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
