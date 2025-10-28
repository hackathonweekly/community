import { CreateTask } from "@/modules/public/tasks/components/CreateTask";

interface CreateTaskPageProps {
	params: Promise<{
		locale: string;
	}>;
}

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
	const { locale } = await params;

	return (
		<div className="container max-w-6xl pt-32 pb-16">
			<CreateTask />
		</div>
	);
}
