import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { TaskDetail } from "@/modules/public/tasks/components/TaskDetail";

// Enable ISR: Revalidate every 30 minutes for tasks
export const revalidate = 1800;

interface TaskDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
	const { id } = await params;

	return (
		<>
			<MobilePageHeader title="任务详情" />
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<TaskDetail taskId={id} />
			</div>
		</>
	);
}
