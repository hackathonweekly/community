"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@community/ui/ui/skeleton";

export default function AccountLoading() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), 300);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<div className="flex min-h-screen w-full">
			<div className="hidden lg:block">
				<Skeleton className="h-screen w-60 rounded-none" />
			</div>
			<div className="flex-1">
				<div className="hidden border-b p-4 lg:block">
					<Skeleton className="h-8 w-96" />
				</div>
				<div className="border-b p-3 lg:hidden">
					<div className="flex gap-2">
						<Skeleton className="h-8 w-16 rounded-full" />
						<Skeleton className="h-8 w-16 rounded-full" />
						<Skeleton className="h-8 w-16 rounded-full" />
					</div>
				</div>
				<div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-8">
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-4 w-1/3" />
					<div className="grid gap-4 pt-4 md:grid-cols-2">
						<div className="space-y-3">
							<Skeleton className="h-32 w-full rounded-xl" />
							<Skeleton className="h-32 w-full rounded-xl" />
						</div>
						<div className="space-y-3">
							<Skeleton className="h-32 w-full rounded-xl" />
							<Skeleton className="h-32 w-full rounded-xl" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
