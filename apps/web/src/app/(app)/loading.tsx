"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@community/ui/ui/skeleton";

export default function AppLoading() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShow(true), 300);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="space-y-4 w-full max-w-sm px-4">
				<div className="flex justify-center">
					<Skeleton className="h-12 w-12 rounded-full" />
				</div>
				<Skeleton className="h-8 w-48 mx-auto" />
				<Skeleton className="h-4 w-64 mx-auto" />
				<div className="pt-4 space-y-3">
					<Skeleton className="h-10 w-full rounded-lg" />
					<Skeleton className="h-10 w-full rounded-lg" />
				</div>
			</div>
		</div>
	);
}
