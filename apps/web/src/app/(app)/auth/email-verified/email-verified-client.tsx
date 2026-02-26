"use client";

import { Button } from "@community/ui/ui/button";
import { useSession } from "@/modules/account/auth/hooks/use-session";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

export function EmailVerifiedClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, loaded } = useSession();
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [countdown, setCountdown] = useState(5);

	// 获取重定向参数
	const redirectTo = searchParams.get("redirectTo") || "/";

	useEffect(() => {
		// 如果用户已登录，自动跳转
		if (loaded && user) {
			setIsRedirecting(true);

			// 倒计时跳转
			const timer = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						clearInterval(timer);
						router.push(redirectTo);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [user, loaded, router, redirectTo]);

	// 如果用户已登录，显示自动跳转信息
	if (loaded && user) {
		return (
			<div className="space-y-4">
				<div className="text-sm text-green-600 bg-green-50 p-4 rounded-lg">
					<div className="flex items-center justify-center gap-2 mb-2">
						<Loader2Icon className="h-4 w-4 animate-spin" />
						<span>检测到您已登录，正在自动跳转...</span>
					</div>
					<p className="text-xs">
						{countdown > 0
							? `${countdown} 秒后自动跳转`
							: "正在跳转..."}
					</p>
				</div>

				<div className="space-y-3">
					<Button
						onClick={() => router.push(redirectTo)}
						className="w-full"
					>
						立即跳转到应用
					</Button>

					<Button
						variant="outline"
						onClick={() => router.push("/auth/login")}
						className="w-full"
					>
						返回登录页
					</Button>
				</div>
			</div>
		);
	}

	// 如果用户未登录，显示手动登录选项
	return (
		<div className="space-y-3">
			<Button
				onClick={() =>
					router.push(
						`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`,
					)
				}
				className="w-full"
			>
				立即登录
			</Button>

			<Button
				variant="outline"
				onClick={() => router.push("/")}
				className="w-full"
			>
				返回首页
			</Button>
		</div>
	);
}
