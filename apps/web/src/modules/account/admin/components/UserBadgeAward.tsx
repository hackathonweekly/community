"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@community/ui/ui/dialog";
import { Badge } from "@community/ui/ui/badge";
import { Button } from "@community/ui/ui/button";
import { Textarea } from "@community/ui/ui/textarea";
import { Award, Trophy, Star, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BadgeData {
	id: string;
	name: string;
	description: string;
	rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
	color?: string;
	isActive?: boolean;
}

interface UserBadgeAwardProps {
	userId: string;
	userName: string;
	trigger?: React.ReactNode;
}

export function UserBadgeAward({
	userId,
	userName,
	trigger,
}: UserBadgeAwardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [badges, setBadges] = useState<BadgeData[]>([]);
	const [userBadges, setUserBadges] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");
	const [reason, setReason] = useState("");

	useEffect(() => {
		if (isOpen) {
			fetchBadges();
			fetchUserBadges();
		}
	}, [isOpen, userId]);

	const fetchBadges = async () => {
		try {
			const response = await fetch("/api/super-admin/badges");
			if (response.ok) {
				const data = await response.json();
				setBadges(
					data.badges.filter(
						(badge: BadgeData) => badge.isActive !== false,
					),
				);
			}
		} catch (error) {
			console.error("Failed to fetch badges:", error);
		}
	};

	const fetchUserBadges = async () => {
		try {
			const response = await fetch(
				`/api/super-admin/users/${userId}/badges`,
			);
			if (response.ok) {
				const data = await response.json();
				setUserBadges(data.badges);
			}
		} catch (error) {
			console.error("Failed to fetch user badges:", error);
		}
	};

	const handleAward = async () => {
		if (!selectedBadgeId) {
			toast.error("请选择要颁发的勋章");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(
				`/api/super-admin/users/${userId}/badges`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						badgeId: selectedBadgeId,
						reason: reason.trim() || undefined,
					}),
				},
			);

			if (response.ok) {
				toast.success("勋章颁发成功！");
				setIsOpen(false);
				setSelectedBadgeId("");
				setReason("");
				fetchUserBadges();
			} else {
				const error = await response.json();
				toast.error(error.error || "颁发失败");
			}
		} catch (error) {
			console.error("Award badge error:", error);
			toast.error("颁发失败");
		} finally {
			setLoading(false);
		}
	};

	const getRarityInfo = (rarity: string) => {
		const rarityMap: Record<
			string,
			{ label: string; className: string; icon: any }
		> = {
			COMMON: {
				label: "普通",
				className: "bg-gray-500 text-white",
				icon: Trophy,
			},
			UNCOMMON: {
				label: "不凡",
				className: "bg-green-500 text-white",
				icon: Star,
			},
			RARE: {
				label: "稀有",
				className: "bg-blue-500 text-white",
				icon: Award,
			},
			EPIC: {
				label: "史诗",
				className: "bg-purple-500 text-white",
				icon: Crown,
			},
			LEGENDARY: {
				label: "传说",
				className: "bg-yellow-500 text-white",
				icon: Crown,
			},
		};
		return rarityMap[rarity] || rarityMap.COMMON;
	};

	// 获取用户已拥有的勋章ID列表
	const userBadgeIds = userBadges.map((ub) => ub.badge?.id || ub.badgeId);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button size="sm">
						<Award className="w-4 h-4 mr-1" />
						颁发勋章
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>为 {userName} 颁发勋章</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* 用户已拥有的勋章 */}
					{userBadges.length > 0 && (
						<div>
							<h4 className="font-medium mb-3">已拥有的勋章</h4>
							<div className="flex flex-wrap gap-2">
								{userBadges.map((userBadge) => {
									const badge = userBadge.badge;
									const rarityInfo = getRarityInfo(
										badge.rarity,
									);
									const Icon = rarityInfo.icon;
									return (
										<Badge
											key={userBadge.id}
											className={rarityInfo.className}
										>
											<Icon className="w-3 h-3 mr-1" />
											{badge.name}
										</Badge>
									);
								})}
							</div>
						</div>
					)}

					{/* 选择勋章 */}
					<div>
						<h4 className="font-medium mb-3">选择要颁发的勋章</h4>
						<div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
							{badges.map((badge) => {
								const rarityInfo = getRarityInfo(badge.rarity);
								const Icon = rarityInfo.icon;
								const isAwarded = userBadgeIds.includes(
									badge.id,
								);

								return (
									<div
										key={badge.id}
										className={`p-3 border rounded-lg cursor-pointer transition-colors ${
											selectedBadgeId === badge.id
												? "border-primary bg-primary/5"
												: "border-border hover:border-border"
										} ${isAwarded ? "opacity-50 cursor-not-allowed" : ""}`}
										onClick={() => {
											if (!isAwarded) {
												setSelectedBadgeId(badge.id);
											}
										}}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center space-x-3">
												<div className="flex-shrink-0">
													<Icon className="w-6 h-6 text-muted-foreground" />
												</div>
												<div>
													<div className="flex items-center space-x-2">
														<h5 className="font-medium">
															{badge.name}
														</h5>
														<Badge
															className={
																rarityInfo.className
															}
														>
															{rarityInfo.label}
														</Badge>
														{isAwarded && (
															<Badge variant="secondary">
																已拥有
															</Badge>
														)}
													</div>
													<p className="text-sm text-muted-foreground mt-1">
														{badge.description}
													</p>
												</div>
											</div>
											{selectedBadgeId === badge.id &&
												!isAwarded && (
													<div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
														<div className="w-2 h-2 rounded-full bg-white" />
													</div>
												)}
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* 颁发原因 */}
					<div>
						<label className="block text-sm font-medium mb-2">
							颁发原因 (可选)
						</label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="例如：在技术分享活动中表现突出"
							rows={3}
						/>
					</div>

					{/* 操作按钮 */}
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => {
								setIsOpen(false);
								setSelectedBadgeId("");
								setReason("");
							}}
						>
							取消
						</Button>
						<Button
							onClick={handleAward}
							disabled={loading || !selectedBadgeId}
						>
							{loading ? "颁发中..." : "确认颁发"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
