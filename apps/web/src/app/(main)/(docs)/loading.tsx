"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@community/ui/ui/skeleton";

export default function DocsLoading() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), 300);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-8">
			<Skeleton className="h-10 w-2/3" />
			<Skeleton className="h-4 w-1/2" />
			<div className="pt-6 space-y-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-5/6" />
				<div className="pt-4">
					<Skeleton className="h-40 w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}
