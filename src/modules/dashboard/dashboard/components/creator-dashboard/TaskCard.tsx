import { useProfileQuery } from "@/lib/api/api-hooks";
import { validateCoreProfile } from "@/lib/utils/profile-validation";
import { useSession } from "@dashboard/auth/hooks/use-session";
import { Calendar, Briefcase, Users, Edit3 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

interface TaskCardProps {
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	href: string;
	primary?: boolean;
	color?: string;
	disabled?: boolean;
}

export function TaskCard({
	title,
	description,
	icon: Icon,
	href,
	primary = false,
	color = "bg-gray-600 hover:bg-gray-700",
	disabled = false,
}: TaskCardProps) {
	return (
		<Link
			href={href}
			className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			}`}
		>
			<div className="flex items-center gap-3">
				<div
					className={`w-8 h-8 rounded-lg flex items-center justify-center ${
						primary ? "bg-green-100" : "bg-gray-100"
					}`}
				>
					<Icon
						className={`h-4 w-4 ${
							primary ? "text-green-600" : "text-gray-600"
						}`}
					/>
				</div>
				<div>
					<div className="text-sm font-medium text-gray-900">
						{title}
					</div>
					<div className="text-xs text-gray-500">{description}</div>
				</div>
			</div>
			<div className="text-gray-400">
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 5l7 7-7 7"
					/>
				</svg>
			</div>
		</Link>
	);
}

export function MainTaskCards() {
	const { user } = useSession();
	const { data: userProfile, isLoading } = useProfileQuery();

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
	const canCreateEvents = true; // 根据配置调整

	const mainTasks = [
		{
			href: "/app/events/create",
			icon: Calendar,
			title: "创建新活动",
			description: "发起黑客松活动",
			isPrimary: canCreateEvents && !needsProfileCompletion,
			color: "bg-green-600 hover:bg-green-700",
			disabled: !canCreateEvents,
		},
		{
			href: "/app/projects/create",
			icon: Briefcase,
			title: "发布新项目",
			description: "分享你的作品",
			isPrimary: !canCreateEvents && !needsProfileCompletion,
			color: "bg-purple-600 hover:bg-purple-700",
			disabled: false,
		},
		{
			href: "/app/interactive-users", // 现在是简化版的互关好友页面
			icon: Users,
			title: "寻找合作伙伴",
			description: "发现志同道合的人",
			isPrimary: false,
			color: "bg-blue-600 hover:bg-blue-700",
			disabled: false,
		},
		{
			href: "/app/profile",
			icon: Edit3,
			title: needsProfileCompletion ? "完善资料" : "编辑资料",
			description: needsProfileCompletion
				? "完成个人信息设置"
				: "更新个人信息",
			isPrimary: needsProfileCompletion,
			color: needsProfileCompletion
				? "bg-orange-600 hover:bg-orange-700"
				: "bg-gray-600 hover:bg-gray-700",
			disabled: false,
		},
	];

	return (
		<div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
			{mainTasks.map((task) => (
				<TaskCard
					key={task.href}
					title={task.title}
					description={task.description}
					icon={task.icon}
					href={task.href}
					primary={task.isPrimary}
					color={task.color}
					disabled={task.disabled}
				/>
			))}
		</div>
	);
}
