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
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface UserCpAdjustProps {
	userId: string;
	userName: string;
	currentCp: number;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function UserCpAdjust({
	userId,
	userName,
	currentCp,
	trigger,
	onSuccess,
}: UserCpAdjustProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [cpChange, setCpChange] = useState<number>(0);
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (cpChange === 0) {
			toast.error("CP变动值不能为0");
			return;
		}

		if (!reason.trim()) {
			toast.error("请填写调整原因");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(
				`/api/super-admin/users/${userId}/adjust-cp`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						cpChange,
						reason: reason.trim(),
					}),
				},
			);

			if (response.ok) {
				toast.success("CP调整成功！");
				setIsOpen(false);
				setCpChange(0);
				setReason("");
				onSuccess?.();
			} else {
				const error = await response.json();
				toast.error(error.error || "调整失败");
			}
		} catch (error) {
			console.error("Adjust CP error:", error);
			toast.error("调整失败");
		} finally {
			setLoading(false);
		}
	};

	const newCpValue = currentCp + cpChange;
	const isDecrease = cpChange < 0;
	const isIncrease = cpChange > 0;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button size="sm" variant="outline">
						<TrendingUp className="w-4 h-4 mr-1" />
						调整CP
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>调整 {userName} 的CP值</DialogTitle>
					<DialogDescription>当前CP值: {currentCp}</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* CP变动输入 */}
					<div>
						<Label htmlFor="cpChange">
							CP变动值 (范围: -1000 到 +1000)
						</Label>
						<div className="flex items-center space-x-2 mt-2">
							<Input
								id="cpChange"
								type="number"
								value={cpChange || ""}
								onChange={(e) => {
									const value =
										Number.parseInt(e.target.value) || 0;
									if (value >= -1000 && value <= 1000) {
										setCpChange(value);
									}
								}}
								placeholder="输入变动值，如 +50 或 -20"
								min={-1000}
								max={1000}
								className="flex-1"
							/>
							{isIncrease && (
								<TrendingUp className="w-5 h-5 text-green-500" />
							)}
							{isDecrease && (
								<TrendingDown className="w-5 h-5 text-red-500" />
							)}
						</div>
						{cpChange !== 0 && (
							<p
								className={`text-sm mt-1 ${
									isIncrease
										? "text-green-600"
										: "text-red-600"
								}`}
							>
								调整后CP值: {newCpValue}
								{isIncrease && ` (+${cpChange})`}
								{isDecrease && ` (${cpChange})`}
							</p>
						)}
					</div>

					{/* 调整原因 */}
					<div>
						<Label htmlFor="reason">调整原因</Label>
						<Textarea
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="请详细描述调整CP的原因..."
							rows={3}
							className="mt-2"
						/>
					</div>

					{/* 操作按钮 */}
					<div className="flex justify-end space-x-2 pt-4">
						<Button
							variant="outline"
							onClick={() => {
								setIsOpen(false);
								setCpChange(0);
								setReason("");
							}}
							disabled={loading}
						>
							取消
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={
								loading || cpChange === 0 || !reason.trim()
							}
							variant={isDecrease ? "destructive" : "default"}
						>
							{loading ? "处理中..." : "确认调整"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
