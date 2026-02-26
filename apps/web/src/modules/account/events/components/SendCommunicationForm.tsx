"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@community/ui/ui/alert-dialog";
import { Badge } from "@community/ui/ui/badge";
import { Progress } from "@community/ui/ui/progress";
import { Alert, AlertDescription } from "@community/ui/ui/alert";
import { Mail, Send, Users, AlertCircle, CheckCircle } from "lucide-react";

const formSchema = z.object({
	type: z.literal("EMAIL"),
	subject: z.string().min(1, "主题不能为空").max(200, "主题最长200字符"),
	content: z.string().min(1, "内容不能为空").max(2000, "内容最长2000字符"),
});

type FormData = z.infer<typeof formSchema>;

interface CommunicationLimitInfo {
	canSend: boolean;
	remainingCount: number;
	totalUsed: number;
	maxAllowed: number;
}

interface SendCommunicationFormProps {
	eventId: string;
	eventTitle: string;
	participantCount: number;
	limitInfo: CommunicationLimitInfo;
	onSend: (data: FormData) => Promise<void>;
	disabled?: boolean;
	className?: string;
}

export function SendCommunicationForm({
	eventId,
	eventTitle,
	participantCount,
	limitInfo,
	onSend,
	disabled = false,
	className,
}: SendCommunicationFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [formData, setFormData] = useState<FormData | null>(null);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: "EMAIL" as const,
			subject: "",
			content: "",
		},
	});

	const watchedSubject = form.watch("subject");
	const watchedContent = form.watch("content");

	const handleSubmit = (data: FormData) => {
		setFormData(data);
		setShowConfirm(true);
	};

	const handleConfirm = async () => {
		if (!formData) return;

		setIsSubmitting(true);
		try {
			await onSend(formData);
			form.reset();
			setShowConfirm(false);
			setFormData(null);
		} catch (error) {
			console.error("发送失败:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getTypeLabel = () => "邮件";

	const getTypeIcon = () => <Mail className="h-4 w-4" />;

	const contentLength = watchedContent?.length || 0;
	const subjectLength = watchedSubject?.length || 0;

	return (
		<Card className={className}>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center space-x-2">
							<Send className="h-5 w-5" />
							<span>发送通知</span>
						</CardTitle>
						<CardDescription>
							向 {eventTitle} 的所有参与者发送邮件通知
							<br />
							<span className="text-amber-600 text-sm">
								⚠️
								系统会自动跳过虚拟邮箱（@wechat.app）或缺少邮箱的用户
							</span>
							<br />
							<span className="text-red-600 text-sm">
								📱
								短信功能已停用：国内运营商目前短信管控严格，无法发送自定义短信内容
							</span>
						</CardDescription>
					</div>
					<div className="text-right">
						<div className="flex items-center space-x-2 text-sm text-muted-foreground">
							<Users className="h-4 w-4" />
							<span>{participantCount} 名参与者</span>
						</div>
					</div>
				</div>

				{/* 发送限制信息 */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">
							发送次数限制
						</span>
						<div className="flex items-center space-x-2">
							<span className="font-medium">
								{limitInfo.totalUsed} / {limitInfo.maxAllowed}
							</span>
							<Badge
								variant={
									limitInfo.canSend
										? "default"
										: "destructive"
								}
								className="text-xs"
							>
								剩余 {limitInfo.remainingCount} 次
							</Badge>
						</div>
					</div>
					<Progress
						value={
							(limitInfo.totalUsed / limitInfo.maxAllowed) * 100
						}
						className="h-2"
					/>
				</div>

				{!limitInfo.canSend && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							该活动已达到最大通信次数限制（{limitInfo.maxAllowed}{" "}
							次），无法继续发送消息。
						</AlertDescription>
					</Alert>
				)}
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
						{/* 通信类型 */}
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>通信类型</FormLabel>
									<FormControl>
										<div className="border rounded-lg p-3 bg-muted">
											<div className="flex items-center space-x-2">
												<Mail className="h-4 w-4 text-primary" />
												<div>
													<div className="font-medium">
														邮件通知
													</div>
													<div className="text-xs text-muted-foreground">
														发送到用户邮箱
													</div>
												</div>
											</div>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 主题 */}
						<FormField
							control={form.control}
							name="subject"
							render={({ field }) => (
								<FormItem>
									<FormLabel>消息主题</FormLabel>
									<FormControl>
										<Input
											placeholder="请输入消息主题"
											{...field}
											maxLength={200}
										/>
									</FormControl>
									<FormDescription className="flex justify-between">
										<span>
											简洁明了的主题有助于提高消息打开率
										</span>
										<span className="text-xs text-muted-foreground">
											{subjectLength}/200
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 内容 */}
						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel>消息内容</FormLabel>
									<FormControl>
										<Textarea
											placeholder="请输入邮件内容..."
											className="min-h-[120px] resize-none"
											{...field}
											maxLength={2000}
										/>
									</FormControl>
									<FormDescription className="flex justify-between">
										<span>支持换行，会保持原有格式</span>
										<span className="text-xs text-muted-foreground">
											{contentLength}/2000
										</span>
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* 发送按钮 */}
						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={
									disabled ||
									!limitInfo.canSend ||
									isSubmitting
								}
								className="min-w-[120px]"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										发送中...
									</>
								) : (
									<>
										<Send className="h-4 w-4 mr-2" />
										发送{getTypeLabel()}
									</>
								)}
							</Button>
						</div>
					</form>
				</Form>

				{/* 确认发送对话框 */}
				<AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="flex items-center space-x-2">
								{formData && getTypeIcon()}
								<span>
									确认发送
									{formData && getTypeLabel()}
								</span>
							</AlertDialogTitle>
							<AlertDialogDescription asChild>
								<div className="space-y-3">
									<p>
										您即将向该活动的所有参与者发送消息，请确认以下信息：
									</p>

									{formData && (
										<div className="bg-muted p-3 rounded-md space-y-2 text-sm">
											<div>
												<span className="font-medium">
													类型：
												</span>
												<span>{getTypeLabel()}</span>
											</div>
											<div>
												<span className="font-medium">
													接收人数：
												</span>
												<span>
													{participantCount} 人
												</span>
											</div>
											<div>
												<span className="font-medium">
													主题：
												</span>
												<span className="text-foreground">
													{formData.subject}
												</span>
											</div>
											<div>
												<span className="font-medium">
													内容预览：
												</span>
												<div className="text-foreground bg-card p-2 rounded border mt-1 max-h-20 overflow-y-auto">
													{formData.content.length >
													100
														? `${formData.content.substring(0, 100)}...`
														: formData.content}
												</div>
											</div>
										</div>
									)}

									<div className="flex items-start space-x-2 text-sm text-amber-600">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<div className="space-y-1">
											<p>
												发送后无法撤回，请仔细检查消息内容。此操作将消耗
												1 次发送机会， 您还剩余{" "}
												<strong>
													{limitInfo.remainingCount}
												</strong>{" "}
												次机会。
											</p>
											<p className="text-amber-700">
												⚠️
												系统会跳过虚拟邮箱（@wechat.app）或缺少邮箱的用户，未验证邮箱仍会发送。
											</p>
										</div>
									</div>
								</div>
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isSubmitting}>
								取消
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleConfirm}
								disabled={isSubmitting}
								className="min-w-[100px]"
							>
								{isSubmitting ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
										发送中
									</>
								) : (
									<>
										<CheckCircle className="h-4 w-4 mr-2" />
										确认发送
									</>
								)}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	);
}
