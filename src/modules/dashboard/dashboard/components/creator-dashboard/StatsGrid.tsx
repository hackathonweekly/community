import {
	useMutualFriendsQuery,
	useUserRegistrationsQuery,
	useProjectsQuery,
} from "@/lib/api/api-hooks";
import { useOrganizationsByRoleQuery } from "@dashboard/organizations/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Calendar, Briefcase, Building } from "lucide-react";
import { StatCard } from "./StatCard";

export function StatsGrid() {
	const queryClient = useQueryClient();

	const {
		data: mutualFriendsData,
		isLoading: mutualLoading,
		error: mutualError,
	} = useMutualFriendsQuery(1);

	const {
		data: events = [],
		isLoading: eventsLoading,
		error: eventsError,
	} = useUserRegistrationsQuery();

	const {
		data: projects = [],
		isLoading: projectsLoading,
		error: projectsError,
	} = useProjectsQuery();

	const {
		data: organizationsData,
		isLoading: orgsLoading,
		error: orgsError,
	} = useOrganizationsByRoleQuery();

	const handleRetry = (queryKey: string[]) => {
		queryClient.invalidateQueries({ queryKey });
	};

	return (
		<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<StatCard
				title="我的朋友"
				icon={Users}
				value={mutualFriendsData?.totalCount || 0}
				subtitle="互关好友"
				href="/app/interactive-users"
				isLoading={mutualLoading}
				error={mutualError}
				onRetry={() => handleRetry(["user", "mutual-friends"])}
			/>

			<StatCard
				title="我的活动"
				icon={Calendar}
				value={events.length}
				subtitle="已参与"
				href="/app/events#registered"
				isLoading={eventsLoading}
				error={eventsError}
				onRetry={() => handleRetry(["user", "registrations"])}
			/>

			<StatCard
				title="我的作品"
				icon={Briefcase}
				value={projects.length}
				subtitle="已发布"
				href="/app/projects"
				isLoading={projectsLoading}
				error={projectsError}
				onRetry={() => handleRetry(["projects"])}
			/>

			<StatCard
				title="我的组织"
				icon={Building}
				value={organizationsData?.organizations.length || 0}
				subtitle="已加入"
				href={
					organizationsData &&
					organizationsData.organizations.length > 0
						? `/app/${organizationsData.organizations[0].slug}`
						: "/app/new-organization"
				}
				isLoading={orgsLoading}
				error={orgsError}
				onRetry={() =>
					handleRetry(["user", "organizations", "by-role"])
				}
			/>
		</div>
	);
}
