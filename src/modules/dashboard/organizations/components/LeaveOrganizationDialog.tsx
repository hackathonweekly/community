"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { useActiveOrganization } from "@dashboard/organizations/hooks/use-active-organization";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useQueryClient } from "@tanstack/react-query";
import { fullOrganizationQueryKey } from "@dashboard/organizations/lib/api";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface LeaveOrganizationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger?: React.ReactNode;
}

export function LeaveOrganizationDialog({
	open,
	onOpenChange,
	trigger,
}: LeaveOrganizationDialogProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const { session } = useSession();
	const [isLeaving, setIsLeaving] = useState(false);

	const handleLeaveOrganization = async () => {
		if (!activeOrganization || !session?.userId) return;

		setIsLeaving(true);

		try {
			await authClient.organization.leave({
				organizationId: activeOrganization.id,
			});

			// 清除所有组织相关的缓存
			queryClient.invalidateQueries({
				queryKey: fullOrganizationQueryKey(activeOrganization.id),
			});

			// 清除 session 缓存，强制重新获取用户权限
			queryClient.invalidateQueries({ queryKey: ["auth", "session"] });

			toast.success(`已成功退出组织"${activeOrganization.name}"`);
			onOpenChange(false);

			// 延迟一下让用户看到成功提示，然后跳转并刷新
			setTimeout(() => {
				router.push("/app");
				router.refresh();
			}, 500);
		} catch (error) {
			console.error("Failed to leave organization:", error);
			toast.error("退出组织失败，请重试");
		} finally {
			setIsLeaving(false);
		}
	};

	if (!activeOrganization) return null;

	return (
		<>
			{trigger && <div onClick={() => onOpenChange(true)}>{trigger}</div>}
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<LogOutIcon className="size-5 text-destructive" />
							退出组织
						</DialogTitle>
						<DialogDescription>
							确定要退出组织"{activeOrganization.name}"吗？
						</DialogDescription>
					</DialogHeader>

					<div className="py-4 text-sm text-muted-foreground">
						<p>退出后：</p>
						<ul className="mt-2 space-y-1 list-disc list-inside">
							<li>您将失去访问该组织的权限</li>
							<li>您需要重新申请或被邀请才能加入</li>
							<li>您的贡献记录将保留</li>
						</ul>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLeaving}
						>
							取消
						</Button>
						<Button
							variant="destructive"
							onClick={handleLeaveOrganization}
							disabled={isLeaving}
						>
							{isLeaving ? "退出中..." : "确认退出"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
