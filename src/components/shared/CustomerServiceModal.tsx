"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CustomerServiceConfig } from "@/config/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	QrCodeIcon,
	BookOpenIcon,
	ExternalLinkIcon,
	MessageSquareIcon,
	HelpCircleIcon,
	CopyIcon,
	CheckIcon,
	MailIcon,
	BugIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

interface CustomerServiceModalProps {
	isOpen: boolean;
	onClose: () => void;
	defaultTab?: string;
	config: CustomerServiceConfig;
}

export function CustomerServiceModal({
	isOpen,
	onClose,
	defaultTab,
	config: customerServiceConfig,
}: CustomerServiceModalProps) {
	const locale = useLocale();
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
	const [qrCodeAlt, setQrCodeAlt] = useState<string>("");
	const [summerWechatCopied, setSummerWechatCopied] = useState(false);
	const [jackieWechatCopied, setJackieWechatCopied] = useState(false);

	// Fetch QR code configuration
	useEffect(() => {
		if (isOpen && customerServiceConfig.community.enabled) {
			fetch("/api/customer-service/config")
				.then((res) => res.json())
				.then((data) => {
					if (data.qrCodeUrl) {
						setQrCodeUrl(data.qrCodeUrl);
						setQrCodeAlt(data.qrCodeAlt || "加入我们的社群");
					} else {
						// 如果没有配置社群二维码，使用公众号二维码
						setQrCodeUrl("/images/wechat_official_qr.jpg");
						setQrCodeAlt("关注公众号 HackathonWeekly");
					}
				})
				.catch(() => {
					// 如果API调用失败，直接使用公众号二维码
					setQrCodeUrl("/images/wechat_official_qr.jpg");
					setQrCodeAlt("关注公众号 HackathonWeekly");
				});
		}
	}, [customerServiceConfig.community.enabled, isOpen]);

	const getDocsUrl = () => {
		return locale === "zh" ? "/docs" : "/docs";
	};

	const handleCopySummerWechat = async () => {
		await navigator.clipboard.writeText("Vivian7days");
		setSummerWechatCopied(true);
		setTimeout(() => setSummerWechatCopied(false), 2000);
	};

	const handleCopyJackieWechat = async () => {
		await navigator.clipboard.writeText("makerjackie");
		setJackieWechatCopied(true);
		setTimeout(() => setJackieWechatCopied(false), 2000);
	};

	const handleFeedbackClick = () => {
		window.open("https://feedback.hackathonweekly.com", "_blank");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MessageSquareIcon className="h-5 w-5" />
						反馈与联系
					</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue={defaultTab || "contact"} className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="contact">
							<MessageSquareIcon className="h-4 w-4 mr-2" />
							联系我们
						</TabsTrigger>

						<TabsTrigger
							value="community"
							disabled={!customerServiceConfig.community.enabled}
						>
							<QrCodeIcon className="h-4 w-4 mr-2" />
							关注我们
						</TabsTrigger>

						<TabsTrigger
							value="docs"
							disabled={
								!customerServiceConfig.feedback.docsIntegration
							}
						>
							<BookOpenIcon className="h-4 w-4 mr-2" />
							查看文档
						</TabsTrigger>
					</TabsList>

					{/* Contact Panel */}
					<TabsContent value="contact" className="space-y-4">
						{/* 商务合作联系 Summer */}
						<div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
									<MailIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
									商务合作联系 Summer
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									微信：Vivian7days，注明来意
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopySummerWechat}
								className="flex-shrink-0"
							>
								{summerWechatCopied ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<CopyIcon className="w-4 h-4" />
								)}
							</Button>
						</div>

						{/* 社区网站联系 Jackie */}
						<div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
									<MessageSquareIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
									社区网站联系 Jackie
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									微信：makerjackie，注明来意
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleCopyJackieWechat}
								className="flex-shrink-0"
							>
								{jackieWechatCopied ? (
									<CheckIcon className="w-4 h-4" />
								) : (
									<CopyIcon className="w-4 h-4" />
								)}
							</Button>
						</div>

						{/* 反馈Bug/建议 */}
						<div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
									<BugIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
									反馈Bug/建议
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									提交您的反馈
								</p>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={handleFeedbackClick}
								className="flex-shrink-0"
							>
								<ExternalLinkIcon className="w-4 h-4" />
							</Button>
						</div>
					</TabsContent>

					{/* Community QR Code Panel */}
					<TabsContent value="community" className="space-y-4">
						<div className="text-center py-4">
							<QrCodeIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
							<h3 className="font-semibold mb-2">关注我们</h3>
							<p className="text-sm text-muted-foreground mb-4">
								扫描二维码关注公众号或加入社群
							</p>

							<div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg inline-block">
								<img
									src={
										qrCodeUrl ||
										"/images/wechat_official_qr.jpg"
									}
									alt={
										qrCodeAlt ||
										"关注公众号 HackathonWeekly"
									}
									className="w-40 h-40 mx-auto"
								/>
								<p className="text-xs text-muted-foreground mt-2">
									{qrCodeAlt || "关注公众号 HackathonWeekly"}
								</p>
							</div>
						</div>
					</TabsContent>

					{/* Documentation Panel */}
					<TabsContent value="docs" className="space-y-4">
						<div className="text-center py-4">
							<BookOpenIcon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
							<h3 className="font-semibold mb-2">帮助文档</h3>
							<p className="text-sm text-muted-foreground mb-4">
								查看详细的使用指南和常见问题解答
							</p>

							<div className="space-y-3">
								<Button
									onClick={() => {
										window.open(getDocsUrl(), "_blank");
										onClose();
									}}
									className="w-full"
									variant="outline"
								>
									<BookOpenIcon className="h-4 w-4 mr-2" />
									浏览帮助文档
									<ExternalLinkIcon className="h-4 w-4 ml-2" />
								</Button>

								<Button
									onClick={() => {
										window.open(
											`${getDocsUrl()}/faq`,
											"_blank",
										);
										onClose();
									}}
									className="w-full"
									variant="ghost"
								>
									<HelpCircleIcon className="h-4 w-4 mr-2" />
									常见问题
									<ExternalLinkIcon className="h-4 w-4 ml-2" />
								</Button>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
