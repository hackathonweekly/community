import { config } from "@/config";
import { useProfileQuery } from "@/lib/api/api-hooks";
import { validateCoreProfile } from "@/lib/utils/profile-validation";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { useTranslations } from "next-intl";
import {
	Calendar,
	Briefcase,
	Users,
	ListTodo,
	Target,
	Building,
	Settings,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface ActionButtonProps {
	title: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	color: string;
	gradient?: string;
	disabled?: boolean;
}

function ActionButton({
	title,
	icon: Icon,
	href,
	color,
	gradient = "",
	disabled = false,
}: ActionButtonProps) {
	return (
		<Link
			href={href}
			className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-2 sm:p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
				disabled
					? "opacity-50 cursor-not-allowed"
					: "hover:border-gray-300"
			}`}
		>
			{gradient && (
				<div
					className={`absolute inset-0 ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
				/>
			)}
			<div className="relative">
				<div
					className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${color} flex items-center justify-center mb-2 sm:mb-3`}
				>
					<Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
				</div>
				<div className="text-xs sm:text-sm font-medium text-gray-900">
					{title}
				</div>
			</div>
		</Link>
	);
}

export function QuickActions() {
	const { user } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();
	const t = useTranslations();

	const profileValidation = useMemo(() => {
		if (!userProfile) return null;
		return validateCoreProfile({
			name: userProfile.name,
			phoneNumber: userProfile.phoneNumber,
			email: userProfile.email,
			bio: userProfile.bio,
			userRoleString: userProfile.userRoleString,
			currentWorkOn: userProfile.currentWorkOn,
			lifeStatus: userProfile.lifeStatus,
			wechatId: userProfile.wechatId,
			skills: userProfile.skills,
			whatICanOffer: userProfile.whatICanOffer,
			whatIAmLookingFor: userProfile.whatIAmLookingFor,
		});
	}, [userProfile]);

	const needsProfileCompletion = (profileValidation?.missingCount ?? 0) > 0;

	const userLevel = userProfile?.membershipLevel;
	const isVisitor =
		userLevel === "VISITOR" ||
		userLevel === null ||
		userLevel === undefined;
	const canCreateEvents = isVisitor
		? config.permissions.visitor.allowEventCreation
		: true;

	// 组织相关权限检查 (这里模拟，实际应该从API获取)
	const hasOrganizationAccess =
		userProfile?.organizationsCount && userProfile.organizationsCount > 0;
	const canCreateOrganization = !isVisitor; // 非访客可以创建组织

	// 创建类功能
	const createActions = [
		...(canCreateEvents
			? [
					{
						href: "/app/events/create",
						icon: Calendar,
						title: "创建活动",
						description: "发起黑客松活动",
						color: "bg-gradient-to-r from-green-500 to-green-600",
						gradient: "from-green-500 to-green-600",
						disabled: false,
					},
				]
			: []),
		{
			href: "/app/projects/create",
			icon: Briefcase,
			title: "发布项目",
			description: "分享你的作品",
			color: "bg-gradient-to-r from-blue-500 to-blue-600",
			gradient: "from-blue-500 to-blue-600",
			disabled: false,
		},
		{
			href: "/app/interactive-users", // 现在是简化版的互关好友页面
			icon: Users,
			title: "寻找伙伴",
			description: "发现志同道合的人",
			color: "bg-gradient-to-r from-purple-500 to-purple-600",
			gradient: "from-purple-500 to-purple-600",
			disabled: false,
		},
		...(canCreateOrganization
			? [
					{
						href: "/app/organizations/create",
						icon: Building,
						title: "创建组织",
						description: "发起你的组织",
						color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
						gradient: "from-indigo-500 to-indigo-600",
						disabled: false,
					},
				]
			: []),
	];

	// 管理类功能
	const manageActions = [
		{
			href: "/app/events/my-events",
			icon: ListTodo,
			title: "我的活动",
			description: "管理参与的活动",
			color: "bg-gradient-to-r from-orange-500 to-orange-600",
			gradient: "from-orange-500 to-orange-600",
			disabled: false,
		},
		{
			href: "/app/tasks",
			icon: Target,
			title: "社区任务",
			description: "完成日常任务",
			color: "bg-gradient-to-r from-teal-500 to-teal-600",
			gradient: "from-teal-500 to-teal-600",
			disabled: false,
		},
		{
			href: "/app/projects/my-projects",
			icon: Briefcase,
			title: "我的项目",
			description: "查看项目进度",
			color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
			gradient: "from-indigo-500 to-indigo-600",
			disabled: false,
		},
		...(hasOrganizationAccess
			? [
					{
						href: "/app/organizations",
						icon: Building,
						title: "我的组织",
						description: "管理组织事务",
						color: "bg-gradient-to-r from-teal-500 to-teal-600",
						gradient: "from-teal-500 to-teal-600",
						disabled: false,
					},
					{
						href: "/app/organizations/settings",
						icon: Settings,
						title: "组织设置",
						description: "配置组织信息",
						color: "bg-gradient-to-r from-cyan-500 to-cyan-600",
						gradient: "from-cyan-500 to-cyan-600",
						disabled: false,
					},
				]
			: []),
	];

	if (isLoading) {
		return <QuickActionsSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* 创建类功能 */}
			<div>
				<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
					<span className="w-1 h-4 bg-green-500 rounded-full" />
					创建功能
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{createActions.map((action) => (
						<ActionButton
							key={action.href}
							title={action.title}
							icon={action.icon}
							href={action.href}
							color={action.color}
							gradient={action.gradient}
							disabled={action.disabled}
						/>
					))}
				</div>
			</div>

			{/* 管理类功能 */}
			<div>
				<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
					<span className="w-1 h-4 bg-blue-500 rounded-full" />
					管理功能
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{manageActions.map((action) => (
						<ActionButton
							key={action.href}
							title={action.title}
							icon={action.icon}
							href={action.href}
							color={action.color}
							gradient={action.gradient}
							disabled={action.disabled}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function QuickActionsSkeleton() {
	return (
		<div className="space-y-4 sm:space-y-6">
			{/* 创建类功能骨架 */}
			<div>
				<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
					<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3"
						>
							<div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 animate-pulse rounded-lg mb-2 sm:mb-3" />
							<div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>

			{/* 管理类功能骨架 */}
			<div>
				<h3 className="text-sm font-medium text-gray-900 mb-3 sm:mb-4">
					<div className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className="rounded-xl border border-gray-200 bg-white p-2 sm:p-3"
						>
							<div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 animate-pulse rounded-lg mb-2 sm:mb-3" />
							<div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
