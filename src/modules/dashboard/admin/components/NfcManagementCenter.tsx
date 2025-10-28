"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Download, Plus, QrCode, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface NfcCard {
	id: string;
	status: "PENDING" | "BOUND";
	boundUser?: {
		id: string;
		name: string;
		username: string;
		image?: string;
	};
	creator: {
		id: string;
		name: string;
	};
	createdAt: string;
	boundAt?: string;
}

export function NfcManagementCenter() {
	const { toast } = useToast();
	const [nfcCards, setNfcCards] = useState<NfcCard[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalCount, setTotalCount] = useState(0);
	const [selectedCards, setSelectedCards] = useState<string[]>([]);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [generateCount, setGenerateCount] = useState(10);
	const [isGenerating, setIsGenerating] = useState(false);

	// 获取NFC列表
	const fetchNfcList = useCallback(async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams();
			if (statusFilter !== "all") {
				params.set("status", statusFilter);
			}
			params.set("limit", "100");
			params.set("offset", "0");

			const response = await fetch(
				`/api/nfc/admin/list?${params.toString()}`,
			);
			const data = await response.json();

			if (response.ok) {
				setNfcCards(data.nfcCards);
				setTotalCount(data.totalCount);
			} else {
				toast({
					title: "获取失败",
					description: data.error || "获取NFC列表失败",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error fetching NFC list:", error);
			toast({
				title: "获取失败",
				description: "获取NFC列表失败",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}, [statusFilter, toast]);

	// 生成NFC
	const handleGenerate = async () => {
		try {
			setIsGenerating(true);
			const response = await fetch("/api/nfc/admin/generate", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ count: generateCount }),
			});

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "生成成功",
					description: `成功生成 ${data.count} 个NFC卡片`,
				});
				fetchNfcList(); // 刷新列表
			} else {
				toast({
					title: "生成失败",
					description: data.error || "生成NFC失败",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error generating NFC:", error);
			toast({
				title: "生成失败",
				description: "生成NFC失败",
				variant: "destructive",
			});
		} finally {
			setIsGenerating(false);
		}
	};

	// 下载二维码
	const handleDownloadQrCode = async (nfcId: string) => {
		try {
			const response = await fetch(`/api/nfc/admin/qrcode/${nfcId}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `nfc_${nfcId}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				toast({
					title: "下载失败",
					description: "下载二维码失败",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error downloading QR code:", error);
			toast({
				title: "下载失败",
				description: "下载二维码失败",
				variant: "destructive",
			});
		}
	};

	// 批量下载ZIP
	const handleBatchDownload = async () => {
		if (selectedCards.length === 0) {
			toast({
				title: "未选择卡片",
				description: "请先选择要下载的NFC卡片",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await fetch(
				`/api/nfc/admin/download-zip?ids=${selectedCards.join(",")}`,
			);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `nfc_qrcodes_${new Date().toISOString().split("T")[0]}.zip`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				toast({
					title: "下载失败",
					description: "批量下载失败",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error batch downloading:", error);
			toast({
				title: "下载失败",
				description: "批量下载失败",
				variant: "destructive",
			});
		}
	};

	// 切换选择
	const toggleSelection = (cardId: string) => {
		setSelectedCards((prev) =>
			prev.includes(cardId)
				? prev.filter((id) => id !== cardId)
				: [...prev, cardId],
		);
	};

	// 全选/取消全选
	const toggleSelectAll = () => {
		if (selectedCards.length === nfcCards.length) {
			setSelectedCards([]);
		} else {
			setSelectedCards(nfcCards.map((card) => card.id));
		}
	};

	useEffect(() => {
		fetchNfcList();
	}, [fetchNfcList]);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "PENDING":
				return <Badge variant="secondary">未绑定</Badge>;
			case "BOUND":
				return <Badge variant="default">已绑定</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			{/* 页面标题和统计 */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">NFC 卡片管理</h1>
					<p className="text-muted-foreground">
						管理NFC卡片的生成、绑定和二维码下载
					</p>
				</div>
				<div className="flex space-x-4 text-sm text-muted-foreground">
					<span>总计: {totalCount}</span>
					<span>已选择: {selectedCards.length}</span>
				</div>
			</div>

			{/* 操作栏 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Plus className="h-5 w-5" />
						<span>批量操作</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center space-x-4">
						{/* 生成NFC */}
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="default">
									<Plus className="h-4 w-4 mr-2" />
									生成NFC卡片
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>批量生成NFC卡片</DialogTitle>
									<DialogDescription>
										生成指定数量的NFC卡片，每个卡片都有唯一的ID和二维码
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div>
										<Label htmlFor="count">生成数量</Label>
										<Input
											id="count"
											type="number"
											min="1"
											max="500"
											value={generateCount}
											onChange={(e) =>
												setGenerateCount(
													Number.parseInt(
														e.target.value,
													) || 10,
												)
											}
										/>
									</div>
									<Button
										onClick={handleGenerate}
										disabled={isGenerating}
										className="w-full"
									>
										{isGenerating ? (
											<>
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
												生成中...
											</>
										) : (
											<>
												<Plus className="h-4 w-4 mr-2" />
												确认生成
											</>
										)}
									</Button>
								</div>
							</DialogContent>
						</Dialog>

						{/* 批量下载 */}
						<Button
							variant="outline"
							onClick={handleBatchDownload}
							disabled={selectedCards.length === 0}
						>
							<Download className="h-4 w-4 mr-2" />
							批量下载ZIP ({selectedCards.length})
						</Button>

						{/* 刷新 */}
						<Button variant="outline" onClick={fetchNfcList}>
							<RefreshCw className="h-4 w-4 mr-2" />
							刷新
						</Button>

						{/* 状态筛选 */}
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							<option value="all">全部状态</option>
							<option value="PENDING">未绑定</option>
							<option value="BOUND">已绑定</option>
						</select>
					</div>
				</CardContent>
			</Card>

			{/* NFC列表 */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>NFC 卡片列表</CardTitle>
						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={
									selectedCards.length === nfcCards.length &&
									nfcCards.length > 0
								}
								onChange={toggleSelectAll}
								className="rounded border border-input"
							/>
							<span className="text-sm text-muted-foreground">
								全选
							</span>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<RefreshCw className="h-6 w-6 animate-spin" />
							<span className="ml-2">加载中...</span>
						</div>
					) : nfcCards.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							暂无NFC卡片
						</div>
					) : (
						<div className="space-y-4">
							{nfcCards.map((card) => (
								<div
									key={card.id}
									className="flex items-center justify-between p-4 border border-border rounded-lg"
								>
									<div className="flex items-center space-x-4">
										<input
											type="checkbox"
											checked={selectedCards.includes(
												card.id,
											)}
											onChange={() =>
												toggleSelection(card.id)
											}
											className="rounded border border-input"
										/>
										<div>
											<div className="font-medium">
												{card.id}
											</div>
											<div className="text-sm text-muted-foreground">
												创建时间:{" "}
												{new Date(
													card.createdAt,
												).toLocaleString()}
												{card.boundAt && (
													<span className="ml-4">
														绑定时间:{" "}
														{new Date(
															card.boundAt,
														).toLocaleString()}
													</span>
												)}
											</div>
											{card.boundUser && (
												<div className="text-sm text-muted-foreground">
													绑定用户:{" "}
													{card.boundUser.name} (@
													{card.boundUser.username})
												</div>
											)}
										</div>
									</div>
									<div className="flex items-center space-x-2">
										{getStatusBadge(card.status)}
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												handleDownloadQrCode(card.id)
											}
										>
											<QrCode className="h-4 w-4 mr-2" />
											下载二维码
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
