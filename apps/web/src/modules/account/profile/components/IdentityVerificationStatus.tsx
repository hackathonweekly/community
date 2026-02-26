"use client";

import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Shield, CheckCircle, AlertCircle, Plus, Settings } from "lucide-react";

interface IdentityVerificationStatusProps {
	hasData: boolean;
	isVerified: boolean;
	onManageIdentity: () => void;
}

export function IdentityVerificationStatus({
	hasData,
	isVerified,
	onManageIdentity,
}: IdentityVerificationStatusProps) {
	const getStatusConfig = () => {
		if (isVerified) {
			return {
				icon: CheckCircle,
				status: "已验证",
				description: "您的身份信息已通过验证",
				statusColor: "text-green-600",
				bgColor: "bg-green-50",
				borderColor: "border-green-200",
				buttonText: "管理身份信息",
				buttonIcon: Settings,
			};
		}

		if (hasData) {
			return {
				icon: AlertCircle,
				status: "待验证",
				description: "身份信息已填写，等待验证",
				statusColor: "text-amber-600",
				bgColor: "bg-amber-50",
				borderColor: "border-amber-200",
				buttonText: "管理身份信息",
				buttonIcon: Settings,
			};
		}

		return {
			icon: Shield,
			status: "未填写",
			description: "参与实名活动时需要填写身份信息",
			statusColor: "text-muted-foreground dark:text-muted-foreground",
			bgColor: "bg-muted dark:bg-secondary",
			borderColor: "border-border dark:border-border",
			buttonText: "填写身份信息",
			buttonIcon: Plus,
		};
	};

	const config = getStatusConfig();
	const StatusIcon = config.icon;
	const ButtonIcon = config.buttonIcon;

	return (
		<Card className="border-border bg-card shadow-sm dark:border-border dark:bg-card">
			<CardHeader className="border-b border-border pb-3 dark:border-border">
				<CardTitle className="flex items-center justify-between text-base">
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						身份验证
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onManageIdentity}
						className="h-8 rounded-full border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-card dark:text-white dark:hover:bg-[#1A1A1A]"
					>
						<ButtonIcon className="mr-1 h-3 w-3" />
						{config.buttonText}
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-4">
				<div
					className={`rounded-md border p-4 ${config.bgColor} ${config.borderColor}`}
				>
					<div className="flex items-start gap-3">
						<StatusIcon
							className={`h-5 w-5 mt-0.5 ${config.statusColor}`}
						/>
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								<span
									className={`text-sm font-medium ${config.statusColor}`}
								>
									{config.status}
								</span>
								{isVerified && (
									<div className="rounded-md border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-800">
										已验证
									</div>
								)}
							</div>
							<p className="text-xs text-muted-foreground dark:text-muted-foreground">
								{config.description}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-3 border-t border-border pt-3 dark:border-border">
					<div className="space-y-1 text-xs text-muted-foreground dark:text-muted-foreground">
						<p>• 身份信息严格保密，仅用于实名制活动验证</p>
						<p>• 快递信息仅在奖品邮寄时使用</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
