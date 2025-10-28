"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserIcon, PhoneIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";

// 性别选项配置
const GENDER_OPTIONS = [
	{ value: "MALE", label: "男", icon: "👨" },
	{ value: "FEMALE", label: "女", icon: "👩" },
	{ value: "OTHER", label: "其他", icon: "🌈" },
	{ value: "NOT_SPECIFIED", label: "不愿透露", icon: "🤐" },
] as const;

interface BasicInfoSectionProps {
	initialData: {
		name?: string | null;
		username?: string | null;
		region?: string | null;
		gender?: string | null;
		phoneNumber?: string | null;
		wechatId?: string | null;
		wechatQrCode?: string | null;
		email?: string | null;
	};
	onOpenDialog: () => void;
}

export function BasicInfoSection({
	initialData,
	onOpenDialog,
}: BasicInfoSectionProps) {
	const t = useTranslations();

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<UserIcon className="h-5 w-5" />
							{t("profile.tabs.basicInfo")}
						</CardTitle>
						<CardDescription>
							{t("profile.basicInfo.description")}
						</CardDescription>
					</div>
					<Button variant="outline" size="sm" onClick={onOpenDialog}>
						<PencilIcon className="h-4 w-4 mr-2" />
						管理
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-6">
					{/* 基础身份信息 - 手机端2列，桌面端3列 */}
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1">
								{t("profile.name.label")}
							</label>
							<p className="text-sm leading-relaxed">
								{initialData.name || "未填写"}
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1">
								{t("profile.basicInfo.username.label")}
							</label>
							<p className="text-sm font-medium">
								{initialData.username || "未填写"}
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1">
								地区
							</label>
							<p className="text-sm">
								{initialData.region || "未填写"}
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1">
								性别
							</label>
							<p className="text-sm">
								{(() => {
									const selectedOption = GENDER_OPTIONS.find(
										(option) =>
											option.value === initialData.gender,
									);
									return selectedOption ? (
										<span className="flex items-center gap-2">
											<span>{selectedOption.icon}</span>
											{selectedOption.label}
										</span>
									) : (
										"未填写"
									);
								})()}
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
								<PhoneIcon className="h-3 w-3" />
								手机号
							</label>
							<p className="text-sm text-foreground">
								{initialData.phoneNumber || "未填写"}
								<span className="ml-2 text-xs text-muted-foreground">
									（仅互关可见）
								</span>
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
								💬 微信号
							</label>
							<p className="text-sm text-foreground">
								{initialData.wechatId || "未填写"}
								<span className="ml-2 text-xs text-muted-foreground">
									（仅互关可见）
								</span>
							</p>
						</div>

						<div>
							<label className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
								📧 邮箱
							</label>
							<p className="text-sm">
								{initialData.email || "未填写"}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
