"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserBanDialogProps {
	userId: string;
	userName: string;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function UserBanDialog({
	userId,
	userName,
	trigger,
	onSuccess,
}: UserBanDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [reason, setReason] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!reason.trim()) {
			toast.error("请填写封禁原因");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(
				`/api/super-admin/users/${userId}/ban`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						reason: reason.trim(),
						expiresAt: expiresAt || undefined,
					}),
				},
			);

			if (response.ok) {
				toast.success("用户封禁成功！");
				setIsOpen(false);
				setReason("");
				setExpiresAt("");
				onSuccess?.();
			} else {
				const error = await response.json();
				toast.error(error.error || "封禁失败");
			}
		} catch (error) {
			console.error("Ban user error:", error);
			toast.error("封禁失败");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button size="sm" variant="destructive">
						<Ban className="w-4 h-4 mr-1" />
						封禁
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>封禁用户 {userName}</DialogTitle>
					<DialogDescription>
						封禁后用户将无法登录和使用系统功能
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* 封禁原因 */}
					<div>
						<Label htmlFor="reason">
							封禁原因
							<span className="text-destructive ml-1">*</span>
						</Label>
						<Textarea
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="请详细说明封禁原因..."
							rows={3}
							className="mt-2"
						/>
					</div>

					{/* 到期时间 */}
					<div>
						<Label htmlFor="expiresAt">到期时间 (可选)</Label>
						<Input
							id="expiresAt"
							type="datetime-local"
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
							className="mt-2"
							min={new Date().toISOString().slice(0, 16)}
						/>
						<p className="text-sm text-muted-foreground mt-1">
							留空为永久封禁
						</p>
					</div>

					{/* 操作按钮 */}
					<div className="flex justify-end space-x-2 pt-4">
						<Button
							variant="outline"
							onClick={() => {
								setIsOpen(false);
								setReason("");
								setExpiresAt("");
							}}
							disabled={loading}
						>
							取消
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={loading || !reason.trim()}
							variant="destructive"
						>
							{loading ? "处理中..." : "确认封禁"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
