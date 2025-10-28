"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
	CreditCard,
	CheckCircle,
	AlertTriangle,
	ExternalLink,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface NfcCard {
	id: string;
	status: "PENDING" | "BOUND";
	boundUsername?: string;
}

interface NfcBindClientProps {
	nfcId: string;
	session: any;
}

export function NfcBindClient({ nfcId, session }: NfcBindClientProps) {
	const { toast } = useToast();
	const router = useRouter();
	const [nfcCard, setNfcCard] = useState<NfcCard | null>(null);
	const [loading, setLoading] = useState(true);
	const [binding, setBinding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 获取NFC卡片信息
	useEffect(() => {
		const fetchNfcCard = async () => {
			try {
				setLoading(true);
				const response = await fetch(`/api/nfc/${nfcId}`);
				const data = await response.json();

				if (response.ok) {
					setNfcCard(data.nfcCard);
					// 如果已绑定，直接跳转到用户页面
					if (
						data.nfcCard.status === "BOUND" &&
						data.nfcCard.boundUsername
					) {
						setTimeout(() => {
							router.push(`/zh/u/${data.nfcCard.boundUsername}`);
						}, 1000);
					}
				} else {
					setError(data.error || "获取NFC信息失败");
				}
			} catch (error) {
				console.error("Error fetching NFC card:", error);
				setError("获取NFC信息失败");
			} finally {
				setLoading(false);
			}
		};

		fetchNfcCard();
	}, [nfcId, router]);

	// 绑定NFC卡片
	const handleBind = async () => {
		if (!session) {
			// 跳转到登录页面，登录后返回此页面
			const returnUrl = encodeURIComponent(window.location.href);
			router.push(`/auth/login?returnTo=${returnUrl}`);
			return;
		}

		try {
			setBinding(true);
			const response = await fetch("/api/nfc/bind", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ nfcId }),
			});

			const data = await response.json();

			if (response.ok) {
				toast({
					title: "绑定成功",
					description: "NFC卡片已成功绑定到您的账户",
				});

				// 跳转到用户个人页面
				router.push(`/zh/u/${data.username}`);
			} else {
				if (response.status === 409) {
					toast({
						title: "绑定失败",
						description: "此NFC卡片已被绑定",
						variant: "destructive",
					});
				} else if (response.status === 400) {
					toast({
						title: "绑定失败",
						description: "您需要设置用户名才能绑定NFC",
						variant: "destructive",
					});
				} else {
					toast({
						title: "绑定失败",
						description: data.error || "绑定失败，请稍后重试",
						variant: "destructive",
					});
				}
			}
		} catch (error) {
			console.error("Error binding NFC card:", error);
			toast({
				title: "绑定失败",
				description: "网络错误，请稍后重试",
				variant: "destructive",
			});
		} finally {
			setBinding(false);
		}
	};

	// 加载状态
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center space-y-4">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
							<p className="text-gray-600">正在获取NFC信息...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// 错误状态
	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
							<AlertTriangle className="h-8 w-8 text-red-600" />
						</div>
						<CardTitle className="text-red-600">
							NFC卡片不存在
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-gray-600">
							抱歉，此NFC卡片不存在或已失效
						</p>
						<Button
							onClick={() => router.push("/zh")}
							className="w-full"
						>
							返回首页
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// 已绑定状态 - 显示跳转信息
	if (nfcCard?.status === "BOUND" && nfcCard.boundUsername) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<CardTitle className="text-green-600">
							NFC已绑定
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-gray-600">
							此NFC卡片已绑定，正在跳转到个人名片页面...
						</p>
						<Button
							onClick={() =>
								router.push(`/zh/u/${nfcCard.boundUsername}`)
							}
							className="w-full"
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							前往个人名片
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// 未绑定状态 - 显示绑定界面
	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
						<CreditCard className="h-8 w-8 text-blue-600" />
					</div>
					<CardTitle>绑定NFC数字名片</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="text-center space-y-2">
						<p className="text-gray-600">
							将此NFC卡片绑定到您的个人数字名片
						</p>
						<p className="text-sm text-gray-500">
							绑定后，其他人扫描此NFC卡片即可查看您的个人信息
						</p>
					</div>

					<div className="bg-gray-50 p-4 rounded-lg">
						<div className="flex items-center space-x-2 text-sm text-gray-600">
							<CreditCard className="h-4 w-4" />
							<span>NFC ID: {nfcId}</span>
						</div>
					</div>

					{session ? (
						<div className="space-y-4">
							<div className="bg-blue-50 p-4 rounded-lg">
								<div className="flex items-center space-x-2 text-sm text-blue-800">
									<User className="h-4 w-4" />
									<span>当前用户: {session.user.name}</span>
								</div>
							</div>
							<Button
								onClick={handleBind}
								disabled={binding}
								className="w-full"
							>
								{binding ? "绑定中..." : "绑定到我的名片"}
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							<div className="bg-yellow-50 p-4 rounded-lg">
								<p className="text-sm text-yellow-800">
									您需要登录才能绑定NFC卡片
								</p>
							</div>
							<Button onClick={handleBind} className="w-full">
								登录并绑定
							</Button>
						</div>
					)}

					<div className="text-center">
						<Button
							variant="outline"
							onClick={() => router.push("/zh")}
							className="text-sm"
						>
							返回首页
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
