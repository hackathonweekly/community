"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	QrCodeIcon,
	SaveIcon,
	RefreshCwIcon,
	EyeIcon,
	AlertCircleIcon,
} from "lucide-react";
import { CustomerServiceWidget } from "@/components/shared/CustomerServiceWidget";

interface CustomerServiceConfig {
	id?: string;
	qrCodeUrl: string | null;
	qrCodeAlt: string | null;
	updatedAt?: string;
	updatedByUser?: {
		name: string;
		email: string;
	};
}

export function CustomerServiceAdmin() {
	const [config, setConfig] = useState<CustomerServiceConfig>({
		qrCodeUrl: null,
		qrCodeAlt: null,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Load current configuration
	const loadConfig = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/customer-service/admin/config");
			if (response.ok) {
				const data = await response.json();
				if (data) {
					setConfig(data);
				}
			}
		} catch (error) {
			console.error("Failed to load config:", error);
			toast.error("加载配置失败");
		} finally {
			setIsLoading(false);
		}
	};

	// Save configuration
	const saveConfig = async () => {
		try {
			setIsSaving(true);
			const response = await fetch("/api/customer-service/admin/config", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					qrCodeUrl: config.qrCodeUrl || null,
					qrCodeAlt: config.qrCodeAlt || null,
				}),
			});

			if (response.ok) {
				const updatedConfig = await response.json();
				setConfig(updatedConfig);
				setHasChanges(false);
				toast.success("配置保存成功");
			} else {
				throw new Error("Failed to save");
			}
		} catch (error) {
			console.error("Failed to save config:", error);
			toast.error("保存失败，请重试");
		} finally {
			setIsSaving(false);
		}
	};

	// Update field and mark as changed
	const updateField = (field: keyof CustomerServiceConfig, value: any) => {
		setConfig((prev) => ({
			...prev,
			[field]: value,
		}));
		setHasChanges(true);
	};

	useEffect(() => {
		loadConfig();
	}, []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<RefreshCwIcon className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">客服配置管理</h1>
					<p className="text-muted-foreground">
						管理客服与反馈功能的配置信息
					</p>
				</div>

				{hasChanges && (
					<Badge variant="outline" className="animate-pulse">
						<AlertCircleIcon className="h-3 w-3 mr-1" />
						有未保存的更改
					</Badge>
				)}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Configuration Form */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<QrCodeIcon className="h-5 w-5" />
							社群二维码配置
						</CardTitle>
						<CardDescription>
							配置社群服务二维码，用户可通过扫码加入社群获取支持
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="qr-code">社群二维码图片</Label>
							<ImageUpload
								label="上传二维码"
								value={config.qrCodeUrl || ""}
								onChange={(url) =>
									updateField("qrCodeUrl", url)
								}
								onRemove={() => updateField("qrCodeUrl", null)}
								acceptedFileTypes={[
									"image/jpeg",
									"image/jpg",
									"image/png",
									"image/webp",
								]}
								maxSizeInMB={2}
								description="推荐尺寸 400x400px，支持 JPG、PNG、WebP 格式"
								className="w-full"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="qr-alt">二维码描述文字</Label>
							<Input
								id="qr-alt"
								placeholder="例如：扫码加入微信群、扫码关注公众号"
								value={config.qrCodeAlt || ""}
								onChange={(e) =>
									updateField("qrCodeAlt", e.target.value)
								}
								maxLength={50}
							/>
							<p className="text-xs text-muted-foreground">
								显示在二维码下方的说明文字，最多50个字符
							</p>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<Button
								onClick={loadConfig}
								variant="outline"
								disabled={isLoading}
							>
								<RefreshCwIcon className="h-4 w-4 mr-2" />
								重新加载
							</Button>

							<Button
								onClick={saveConfig}
								disabled={isSaving || !hasChanges}
								className="min-w-[100px]"
							>
								{isSaving ? (
									<RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
								) : (
									<SaveIcon className="h-4 w-4 mr-2" />
								)}
								保存配置
							</Button>
						</div>

						{config.updatedAt && (
							<div className="text-xs text-muted-foreground pt-2 border-t">
								最后更新：
								{new Date(config.updatedAt).toLocaleString()}
								{config.updatedByUser && (
									<>，由 {config.updatedByUser.name} 更新</>
								)}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Preview */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<EyeIcon className="h-5 w-5" />
							预览效果
						</CardTitle>
						<CardDescription>
							查看客服功能在前端的显示效果
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-4">
							<div>
								<Label className="text-sm font-medium">
									内联按钮样式
								</Label>
								<div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
									<CustomerServiceWidget variant="inline" />
								</div>
							</div>
						</div>

						<Separator />

						<div className="text-sm text-muted-foreground space-y-2">
							<h4 className="font-medium text-foreground">
								使用说明：
							</h4>
							<ul className="space-y-1 ml-4">
								<li>• 点击后弹出客服选项卡</li>
								<li>
									• 支持AI助手（预留）、社群二维码、帮助文档
								</li>
								<li>• 配置更新后立即生效</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
