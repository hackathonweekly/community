"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
			statusColor: "text-muted-foreground",
			bgColor: "bg-muted/30",
			borderColor: "border-muted",
			buttonText: "填写身份信息",
			buttonIcon: Plus,
		};
	};

	const config = getStatusConfig();
	const StatusIcon = config.icon;
	const ButtonIcon = config.buttonIcon;

	return (
		<Card>
			<CardHeader>
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
						className="h-8 text-xs"
					>
						<ButtonIcon className="h-3 w-3 mr-1" />
						{config.buttonText}
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div
					className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
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
									<div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
										已验证
									</div>
								)}
							</div>
							<p className="text-xs text-muted-foreground">
								{config.description}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-3 pt-3 border-t">
					<div className="text-xs text-muted-foreground space-y-1">
						<p>• 身份信息严格保密，仅用于实名制活动验证</p>
						<p>• 快递信息仅在奖品邮寄时使用</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
