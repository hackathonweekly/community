"use client";

import { useKeyboardDetection } from "@community/lib-client/hooks/use-keyboard-detection";
import { cn } from "@community/lib-shared/utils";
import { Heart, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface OrganizationMobileBottomToolbarProps {
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	isApplicationOpen: boolean;
	isLoggedIn: boolean;
	userMembership: any;
}

export function OrganizationMobileBottomToolbar({
	organizationId,
	organizationName,
	organizationSlug,
	isApplicationOpen,
	isLoggedIn,
	userMembership,
}: OrganizationMobileBottomToolbarProps) {
	const router = useRouter();
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
			router.push(`/orgs/${organizationSlug}/members`);
			return;
		}

		if (!isApplicationOpen) {
			return;
		}

		if (isLoggedIn) {
			router.push(`/orgs/${organizationSlug}/apply`);
		} else {
			router.push(
				`/auth/login?redirectTo=/orgs/${organizationSlug}/apply`,
			);
		}
	};
	const showPrimaryAction = Boolean(userMembership) || isApplicationOpen;

	return (
		<div
			className={cn(
				"lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-card/95 backdrop-blur border-t border-border h-14 flex items-center justify-center z-50 px-4 transition-transform duration-300",
				isKeyboardVisible ? "translate-y-full" : "translate-y-0",
			)}
		>
			<div className="flex items-center gap-3 w-full max-w-sm">
				{showPrimaryAction && (
					<button
						type="button"
						onClick={handlePrimaryAction}
						className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-2 rounded-md font-bold text-xs shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
					>
						{userMembership ? (
							<>
								<Users className="h-3.5 w-3.5" />
								查看成员
							</>
						) : isLoggedIn ? (
							<>
								<Heart className="h-3.5 w-3.5" />
								申请加入
							</>
						) : (
							<>
								<Heart className="h-3.5 w-3.5" />
								登录申请
							</>
						)}
					</button>
				)}
				<button
					type="button"
					onClick={handleShare}
					className={cn(
						"flex items-center justify-center gap-2 bg-card border border-border text-foreground py-2 px-4 rounded-md text-xs font-bold hover:bg-muted transition-colors",
						!showPrimaryAction && "w-full",
					)}
				>
					<Share2 className="h-3.5 w-3.5" />
					分享
				</button>
			</div>
		</div>
	);
}
