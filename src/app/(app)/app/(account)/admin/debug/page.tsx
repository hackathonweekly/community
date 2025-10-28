import { getSession } from "@dashboard/auth/lib/server";
import {
	AdminPermission,
	hasPermission,
	isAdmin,
} from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export default async function DebugPage() {
	const session = await getSession();

	if (!session) {
		return redirect("/auth/login");
	}

	const userPermissions = Object.values(AdminPermission).map(
		(permission) => ({
			permission,
			hasPermission: hasPermission(session.user, permission),
		}),
	);

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">调试信息</h1>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white rounded-lg border p-4">
					<h2 className="text-lg font-semibold mb-4">用户信息</h2>
					<div className="space-y-2">
						<p>
							<strong>用户ID:</strong> {session.user.id}
						</p>
						<p>
							<strong>用户名:</strong> {session.user.name}
						</p>
						<p>
							<strong>邮箱:</strong> {session.user.email}
						</p>
						<p>
							<strong>角色:</strong>{" "}
							<code className="bg-gray-100 px-2 py-1 rounded">
								{(session.user as any).role || "null"}
							</code>
						</p>
						<p>
							<strong>是否管理员:</strong>{" "}
							{isAdmin(session.user) ? "✅ 是" : "❌ 否"}
						</p>
					</div>
				</div>

				<div className="bg-white rounded-lg border p-4">
					<h2 className="text-lg font-semibold mb-4">权限检查</h2>
					<div className="space-y-1 max-h-96 overflow-y-auto">
						{userPermissions.map(
							({ permission, hasPermission: has }) => (
								<div
									key={permission}
									className="flex justify-between items-center py-1"
								>
									<span className="text-sm">
										{permission}
									</span>
									<span
										className={`text-sm ${has ? "text-green-600" : "text-red-600"}`}
									>
										{has ? "✅" : "❌"}
									</span>
								</div>
							),
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
