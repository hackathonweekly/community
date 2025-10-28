"use client";

import { Button } from "@/components/ui/button";
import { Heart, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useKeyboardDetection } from "@/lib/hooks/use-keyboard-detection";
import { cn } from "@/lib/utils";

interface OrganizationMobileBottomToolbarProps {
	organizationId: string;
	organizationName: string;
	isLoggedIn: boolean;
	userMembership: any;
}

export function OrganizationMobileBottomToolbar({
	organizationId,
	organizationName,
	isLoggedIn,
	userMembership,
}: OrganizationMobileBottomToolbarProps) {
	const router = useRouter();

	// 使用自定义 hook 检测键盘是否弹出
	const isKeyboardVisible = useKeyboardDetection();

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: organizationName,
					text: `了解组织：${organizationName}`,
					url: window.location.href,
				});
			} catch (error) {
				console.error("Error sharing:", error);
			}
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert("链接已复制");
		}
	};

	const handlePrimaryAction = () => {
		if (userMembership) {
			// 已是成员，进入组织
			router.push(`/app/${organizationName}`);
		} else if (isLoggedIn) {
			// 已登录但不是成员，申请加入
			router.push(`/orgs/${organizationName}/apply`);
		} else {
			// 未登录，跳转到登录
			router.push(
				`/auth/login?redirectTo=/orgs/${organizationName}/apply`,
			);
		}
	};

	return (
		<div
			className={cn(
				"md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 transition-transform duration-300",
				// 键盘弹出时隐藏底部工具栏
				isKeyboardVisible ? "translate-y-full" : "translate-y-0",
			)}
		>
			<div className="flex items-center justify-center gap-3 max-w-sm mx-auto px-2">
				<Button
					onClick={handlePrimaryAction}
					size="sm"
					className="flex-1 min-w-0"
				>
					{userMembership ? (
						<>
							<Users className="h-4 w-4 mr-2" />
							进入组织
						</>
					) : isLoggedIn ? (
						<>
							<Heart className="h-4 w-4 mr-2" />
							申请加入
						</>
					) : (
						<>
							<Heart className="h-4 w-4 mr-2" />
							登录申请
						</>
					)}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={handleShare}
					className="flex-1 min-w-0"
				>
					<Share2 className="h-4 w-4 mr-2" />
					分享
				</Button>
			</div>
		</div>
	);
}
