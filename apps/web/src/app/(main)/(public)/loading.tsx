import { Skeleton } from "@community/ui/ui/skeleton";

export default function PublicLoading() {
	return (
		<div className="flex min-h-screen w-full">
			{/* Desktop sidebar skeleton */}
			<div className="hidden lg:block">
				<Skeleton className="h-screen w-60 rounded-none" />
			</div>
			<div className="flex-1">
				{/* Desktop top bar skeleton */}
				<div className="hidden border-b p-4 lg:block">
					<Skeleton className="h-8 w-96" />
				</div>
				{/* Mobile top nav skeleton */}
				<div className="border-b p-3 lg:hidden">
					<div className="flex gap-2">
						<Skeleton className="h-8 w-16 rounded-full" />
						<Skeleton className="h-8 w-16 rounded-full" />
						<Skeleton className="h-8 w-16 rounded-full" />
						<Skeleton className="h-8 w-16 rounded-full" />
					</div>
				</div>
				{/* Page content skeleton */}
				<div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-8">
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-4 w-1/3" />
					<div className="pt-4 space-y-3">
						<Skeleton className="h-24 w-full rounded-xl" />
						<Skeleton className="h-24 w-full rounded-xl" />
						<Skeleton className="h-24 w-full rounded-xl" />
					</div>
				</div>
			</div>
		</div>
	);
}
