"use client";

import { MobilePageHeader } from "@/modules/public/shared/components/MobilePageHeader";
import { CreateTask } from "@/modules/public/tasks/components/CreateTask";

export default function CreateTaskPage() {
	return (
		<>
			<MobilePageHeader title="发布任务" />
			<div className="mx-auto max-w-6xl px-4 pb-20 pt-5 lg:px-8 lg:pb-16 lg:pt-6">
				<CreateTask />
			</div>
		</>
	);
}
