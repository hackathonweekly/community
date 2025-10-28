"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Trophy,
	Plus,
	Star,
	Award,
	Crown,
	Users,
	Edit,
	Trash2,
	Info,
	ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface BadgeData {
	id: string;
	name: string;
	description: string;
	icon?: string;
	color?: string;
	rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
	isActive: boolean;
	isAutoAwarded: boolean;
	conditions?: any;
	awardedCount: number;
	createdAt: string;
}

export function BadgeManagementCenter() {
	const [badges, setBadges] = useState<BadgeData[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	// 表单状态
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		icon: "",
		color: "",
		rarity: "COMMON" as
			| "COMMON"
			| "UNCOMMON"
			| "RARE"
			| "EPIC"
			| "LEGENDARY",
		isActive: true,
		isAutoAwarded: false,
		conditions: "",
	});

	useEffect(() => {
		fetchBadges();
	}, []);

	const fetchBadges = async () => {
		try {
			const response = await fetch("/api/super-admin/badges");
			if (response.ok) {
				const data = await response.json();
				setBadges(data.badges);
			}
		} catch (error) {
			console.error("Failed to fetch badges:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const url = editingBadge
				? `/api/super-admin/badges/${editingBadge.id}`
				: "/api/super-admin/badges";

			const method = editingBadge ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					conditions: formData.conditions
						? JSON.parse(formData.conditions)
						: null,
				}),
			});

			if (response.ok) {
				resetForm();
				fetchBadges();
			}
		} catch (error) {
			console.error("Failed to save badge:", error);
		}
	};

	const handleDelete = async (badgeId: string) => {
		if (!confirm("确定要删除这个勋章吗？已颁发的勋章将保留。")) {
			return;
		}

		try {
			const response = await fetch(`/api/super-admin/badges/${badgeId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchBadges();
			}
		} catch (error) {
			console.error("Failed to delete badge:", error);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			icon: "",
			color: "",
			rarity: "COMMON" as
				| "COMMON"
				| "UNCOMMON"
				| "RARE"
				| "EPIC"
				| "LEGENDARY",
			isActive: true,
			isAutoAwarded: false,
			conditions: "",
		});
		setEditingBadge(null);
		setIsCreating(false);
	};

	const startEdit = (badge: BadgeData) => {
		setFormData({
			name: badge.name,
			description: badge.description,
			icon: badge.icon || "",
			color: badge.color || "",
			rarity: badge.rarity,
			isActive: badge.isActive,
			isAutoAwarded: badge.isAutoAwarded,
			conditions: badge.conditions
				? JSON.stringify(badge.conditions, null, 2)
				: "",
		});
		setEditingBadge(badge);
		setIsCreating(true);
	};

	const getRarityBadge = (rarity: string) => {
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

		const info = rarityMap[rarity] || rarityMap.COMMON;
		const Icon = info.icon;

		return (
			<Badge className={info.className}>
				<Icon className="w-3 h-3 mr-1" />
				{info.label}
			</Badge>
		);
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 bg-gray-200 rounded w-64" />
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-32 bg-gray-200 rounded" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">勋章管理</h1>
					<p className="text-gray-600 mt-2">管理社区勋章系统</p>
				</div>

				<Button onClick={() => setIsCreating(true)}>
					<Plus className="w-4 h-4 mr-2" />
					创建勋章
				</Button>
			</div>

			{/* 操作提示 */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="pt-6">
					<div className="flex items-start space-x-3">
						<Info className="h-5 w-5 text-blue-600 mt-0.5" />
						<div className="flex-1">
							<h3 className="font-medium text-blue-900 mb-2">
								颁发勋章给成员
							</h3>
							<p className="text-blue-800 text-sm mb-3">
								创建勋章后，你可以通过用户管理页面为社区成员手动颁发勋章，或者设置自动颁发条件让系统自动奖励符合条件的用户。
							</p>
							<Link href="/app/admin/users">
								<Button
									variant="outline"
									size="sm"
									className="text-blue-700 border-blue-300 hover:bg-blue-100"
								>
									<Users className="h-4 w-4 mr-2" />
									前往用户管理页面
									<ExternalLink className="h-3 w-3 ml-1" />
								</Button>
							</Link>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 统计卡片 */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Trophy className="h-4 w-4 text-yellow-600" />
							<div>
								<div className="text-2xl font-bold">
									{badges.length}
								</div>
								<div className="text-sm text-gray-600">
									总勋章数
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Star className="h-4 w-4 text-green-600" />
							<div>
								<div className="text-2xl font-bold">
									{badges.filter((b) => b.isActive).length}
								</div>
								<div className="text-sm text-gray-600">
									活跃勋章
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Award className="h-4 w-4 text-blue-600" />
							<div>
								<div className="text-2xl font-bold">
									{
										badges.filter((b) => b.isAutoAwarded)
											.length
									}
								</div>
								<div className="text-sm text-gray-600">
									自动颁发
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center space-x-2">
							<Users className="h-4 w-4 text-purple-600" />
							<div>
								<div className="text-2xl font-bold">
									{badges.reduce(
										(sum, b) => sum + b.awardedCount,
										0,
									)}
								</div>
								<div className="text-sm text-gray-600">
									已颁发总数
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 创建/编辑表单 */}
			{isCreating && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingBadge ? "编辑勋章" : "创建新勋章"}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-2">
										勋章名称
									</label>
									<Input
										value={formData.name}
										onChange={(e) =>
											setFormData({
												...formData,
												name: e.target.value,
											})
										}
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">
										稀有度
									</label>
									<select
										value={formData.rarity}
										onChange={(e) =>
											setFormData({
												...formData,
												rarity: e.target.value as any,
											})
										}
										className="w-full border rounded px-3 py-2"
									>
										<option value="COMMON">普通</option>
										<option value="UNCOMMON">不凡</option>
										<option value="RARE">稀有</option>
										<option value="EPIC">史诗</option>
										<option value="LEGENDARY">传说</option>
									</select>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
									描述
								</label>
								<Textarea
									value={formData.description}
									onChange={(e) =>
										setFormData({
											...formData,
											description: e.target.value,
										})
									}
									required
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-2">
										图标 (可选)
									</label>
									<Input
										value={formData.icon}
										onChange={(e) =>
											setFormData({
												...formData,
												icon: e.target.value,
											})
										}
										placeholder="图标名称或URL"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium mb-2">
										颜色 (可选)
									</label>
									<Input
										value={formData.color}
										onChange={(e) =>
											setFormData({
												...formData,
												color: e.target.value,
											})
										}
										placeholder="#FF5722"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.isActive}
										onChange={(e) =>
											setFormData({
												...formData,
												isActive: e.target.checked,
											})
										}
									/>
									<span>启用勋章</span>
								</label>

								<label className="flex items-center space-x-2">
									<input
										type="checkbox"
										checked={formData.isAutoAwarded}
										onChange={(e) =>
											setFormData({
												...formData,
												isAutoAwarded: e.target.checked,
											})
										}
									/>
									<span>自动颁发</span>
								</label>
							</div>

							{formData.isAutoAwarded && (
								<div>
									<label className="block text-sm font-medium mb-2">
										自动颁发条件 (JSON格式)
									</label>
									<Textarea
										value={formData.conditions}
										onChange={(e) =>
											setFormData({
												...formData,
												conditions: e.target.value,
											})
										}
										placeholder='{"contributionCount": 10, "eventAttendance": 5}'
										className="font-mono text-sm"
									/>
								</div>
							)}

							<div className="flex space-x-2">
								<Button type="submit">
									{editingBadge ? "更新勋章" : "创建勋章"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={resetForm}
								>
									取消
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* 勋章列表 */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{badges.map((badge) => (
					<Card key={badge.id}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<Trophy className="h-6 w-6 text-yellow-600" />
									<div>
										<CardTitle className="text-lg">
											{badge.name}
										</CardTitle>
										<CardDescription>
											{badge.description}
										</CardDescription>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									{!badge.isActive && (
										<Badge variant="secondary">
											已停用
										</Badge>
									)}
									{badge.isAutoAwarded && (
										<Badge variant="outline">自动</Badge>
									)}
									{getRarityBadge(badge.rarity)}
								</div>
							</div>
						</CardHeader>

						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<div className="font-medium mb-1">
										已颁发
									</div>
									<div className="text-blue-600 font-semibold">
										{badge.awardedCount} 次
									</div>
								</div>
								<div>
									<div className="font-medium mb-1">
										创建时间
									</div>
									<div className="text-gray-600">
										{new Date(
											badge.createdAt,
										).toLocaleDateString("zh-CN")}
									</div>
								</div>
							</div>

							{badge.conditions && (
								<div>
									<div className="text-sm font-medium mb-2">
										自动颁发条件
									</div>
									<div className="text-xs bg-gray-50 p-2 rounded font-mono">
										{JSON.stringify(
											badge.conditions,
											null,
											2,
										)}
									</div>
								</div>
							)}

							<div className="flex space-x-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => startEdit(badge)}
								>
									<Edit className="w-4 h-4 mr-1" />
									编辑
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleDelete(badge.id)}
									className="text-red-600 border-red-600 hover:bg-red-50"
								>
									<Trash2 className="w-4 h-4 mr-1" />
									删除
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
