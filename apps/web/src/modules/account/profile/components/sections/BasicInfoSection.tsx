"use client";

import { useTranslations } from "next-intl";
import {
	CircleDotIcon,
	MailIcon,
	MapPinIcon,
	MessageCircleIcon,
	PencilIcon,
	PhoneIcon,
	UserIcon,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Button } from "@community/ui/ui/button";

const GENDER_OPTIONS = [
	{ value: "MALE", label: "男" },
	{ value: "FEMALE", label: "女" },
	{ value: "OTHER", label: "其他" },
	{ value: "NOT_SPECIFIED", label: "不愿透露" },
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
	const genderLabel =
		GENDER_OPTIONS.find((option) => option.value === initialData.gender)
			?.label ?? "未填写";

	const fieldClassName =
		"rounded-md bg-muted p-3 dark:bg-secondary dark:text-white";
	const labelClassName =
		"mb-1 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-muted-foreground dark:text-muted-foreground";
	const valueClassName = "text-sm font-medium text-foreground";

	return (
		<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
			<CardHeader className="border-b border-border pb-3 dark:border-border">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2 text-base font-bold">
							<UserIcon className="h-4 w-4" />
							{t("profile.tabs.basicInfo")}
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
							{t("profile.basicInfo.description")}
						</CardDescription>
					</div>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onOpenDialog}
						className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
					>
						<PencilIcon className="mr-1 h-3.5 w-3.5" />
						管理
					</Button>
				</div>
			</CardHeader>
			<CardContent className="pt-4">
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<div className={fieldClassName}>
						<label className={labelClassName}>
							<UserIcon className="h-3 w-3" />
							{t("profile.name.label")}
						</label>
						<p className={valueClassName}>
							{initialData.name || "未填写"}
						</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<UserIcon className="h-3 w-3" />
							{t("profile.basicInfo.username.label")}
						</label>
						<p className={valueClassName}>
							{initialData.username || "未填写"}
						</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<MapPinIcon className="h-3 w-3" />
							地区
						</label>
						<p className={valueClassName}>
							{initialData.region || "未填写"}
						</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<CircleDotIcon className="h-3 w-3" />
							性别
						</label>
						<p className={valueClassName}>{genderLabel}</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<PhoneIcon className="h-3 w-3" />
							手机号
						</label>
						<p className={valueClassName}>
							{initialData.phoneNumber || "未填写"}
							<span className="ml-2 text-[10px] font-normal text-muted-foreground dark:text-muted-foreground">
								（仅互关可见）
							</span>
						</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<MessageCircleIcon className="h-3 w-3" />
							微信号
						</label>
						<p className={valueClassName}>
							{initialData.wechatId || "未填写"}
							<span className="ml-2 text-[10px] font-normal text-muted-foreground dark:text-muted-foreground">
								（仅互关可见）
							</span>
						</p>
					</div>

					<div className={fieldClassName}>
						<label className={labelClassName}>
							<MailIcon className="h-3 w-3" />
							邮箱
						</label>
						<p className={valueClassName}>
							{initialData.email || "未填写"}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
