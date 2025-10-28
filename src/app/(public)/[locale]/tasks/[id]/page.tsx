import { TaskDetail } from "@/modules/public/tasks/components/TaskDetail";

// Enable ISR: Revalidate every 30 minutes for tasks
export const revalidate = 1800;

interface TaskDetailPageProps {
	params: Promise<{
		id: string;
		locale: string;
	}>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
	const { id, locale } = await params;

	return (
		<div className="container max-w-6xl pt-32 pb-16">
			<TaskDetail taskId={id} />
		</div>
	);
}
