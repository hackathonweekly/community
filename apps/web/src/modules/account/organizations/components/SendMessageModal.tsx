"use client";

import { useState } from "react";
import { Button } from "@community/ui/ui/button";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@community/ui/ui/tabs";

interface SendMessageModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSendMessage: (
		type: "EMAIL" | "SMS",
		subject: string,
		content: string,
	) => void;
	selectedCount: number;
	totalCount: number;
}

export function SendMessageModal({
	open,
	onOpenChange,
	onSendMessage,
	selectedCount,
	totalCount,
}: SendMessageModalProps) {
	const [messageType, setMessageType] = useState<"EMAIL" | "SMS">("EMAIL");
	const [subject, setSubject] = useState("");
	const [content, setContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!subject.trim() || !content.trim()) return;

		setIsLoading(true);
		try {
			await onSendMessage(messageType, subject, content);
			setSubject("");
			setContent("");
		} finally {
			setIsLoading(false);
		}
	};

	const recipientText =
		selectedCount > 0
			? `发送给选中的 ${selectedCount} 个成员`
			: `发送给所有 ${totalCount} 个成员`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>群发消息</DialogTitle>
					<DialogDescription>{recipientText}</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">消息类型</label>
						<Tabs
							value={messageType}
							onValueChange={(value) =>
								setMessageType(value as "EMAIL" | "SMS")
							}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="EMAIL">邮件</TabsTrigger>
								<TabsTrigger value="SMS">短信</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="subject"
							className="text-sm font-medium"
						>
							{messageType === "EMAIL" ? "邮件主题" : "消息标题"}
						</label>
						<Input
							id="subject"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={
								messageType === "EMAIL"
									? "输入邮件主题..."
									: "输入消息标题..."
							}
							required
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="content"
							className="text-sm font-medium"
						>
							消息内容
						</label>
						<Textarea
							id="content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="输入消息内容..."
							rows={6}
							required
						/>
					</div>

					<div className="rounded-lg border border-border bg-accent/50 p-3">
						<p className="text-sm text-muted-foreground">
							<strong>提醒：</strong>
							{messageType === "EMAIL"
								? "邮件将发送给所有有邮箱地址的成员"
								: "短信将发送给所有有手机号的成员"}
						</p>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							取消
						</Button>
						<Button
							type="submit"
							disabled={
								isLoading || !subject.trim() || !content.trim()
							}
						>
							{isLoading
								? "发送中..."
								: `发送${messageType === "EMAIL" ? "邮件" : "短信"}`}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
