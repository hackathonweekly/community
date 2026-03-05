import { config } from "@community/config";
import { getOrganizationList, getSession } from "@shared/auth/lib/server";
import { EnhancedCreateOrganizationForm } from "@account/organizations/components/EnhancedCreateOrganizationForm";
import { redirect } from "next/navigation";
import {
	canUserDoAction,
	RestrictedAction,
	getMembershipLevelName,
} from "@/features/permissions";
import type { MembershipLevel } from "@prisma/client";
import { Alert, AlertDescription } from "@community/ui/ui/alert";
import { Button } from "@community/ui/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewOrganizationPage() {
	const organizations = await getOrganizationList();
	const session = await getSession();

	if (
		!config.organizations.enable ||
		(!config.organizations.enableUsersToCreateOrganizations &&
			(!config.organizations.requireOrganization ||
				organizations.length > 0))
	) {
		return redirect("/");
	}

	// 检查用户是否有创建组织的权限
	const permissionCheck = canUserDoAction(
		{ membershipLevel: session?.user?.membershipLevel as MembershipLevel },
		RestrictedAction.CREATE_ORGANIZATION,
	);

	// 如果没有权限，显示提示信息
	if (!permissionCheck.allowed) {
		return (
			<div className="container mx-auto max-w-md p-6">
				<Alert className="mb-6">
					<AlertDescription className="space-y-4">
						<p className="font-medium">无法创建组织</p>
						<p>{permissionCheck.reason}</p>
						<p className="text-sm text-muted-foreground">
							当前用户身份：
							{getMembershipLevelName(
								(session?.user
									?.membershipLevel as MembershipLevel) ||
									null,
							)}
						</p>
					</AlertDescription>
				</Alert>
				<div className="flex gap-2">
					<Button asChild variant="outline">
						<Link href="/">返回首页</Link>
					</Button>
				</div>
			</div>
		);
	}

	return <EnhancedCreateOrganizationForm />;
}
