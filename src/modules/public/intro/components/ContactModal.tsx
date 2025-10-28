"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Mail,
	MessageCircle,
	Copy,
	Check,
	FileText,
	ExternalLink,
} from "lucide-react";

interface ContactModalProps {
	children: React.ReactNode;
}

export function ContactModal({ children }: ContactModalProps) {
	const [summerWechatCopied, setSummerWechatCopied] = useState(false);
	const [jackieWechatCopied, setJackieWechatCopied] = useState(false);

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
		window.open(
			"https://hackathonweekly.feishu.cn/share/base/form/shrcnCtnekj4OJPgnV16G9ZqlCe",
			"_blank",
		);
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-center">联系我们</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{/* 商务合作联系 Summer */}
					<div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
								<Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
								<Check className="w-4 h-4" />
							) : (
								<Copy className="w-4 h-4" />
							)}
						</Button>
					</div>

					{/* 社区网站联系 Jackie */}
					<div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
								<MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
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
								<Check className="w-4 h-4" />
							) : (
								<Copy className="w-4 h-4" />
							)}
						</Button>
					</div>

					{/* 反馈Bug/建议 */}
					<div className="flex items-center space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
						<div className="flex-shrink-0">
							<div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
								<FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
								反馈Bug/建议
							</p>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								填写问卷
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleFeedbackClick}
							className="flex-shrink-0"
						>
							<ExternalLink className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
