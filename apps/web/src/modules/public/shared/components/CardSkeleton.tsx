import { Skeleton } from "@community/ui/ui/skeleton";

interface CardSkeletonProps {
	count?: number;
	className?: string;
}

export function CardSkeleton({ count = 6, className }: CardSkeletonProps) {
	return (
		<div
			className={
				className ??
				"grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
			}
		>
			{Array.from({ length: count }).map((_, index) => (
				<div key={index} className="rounded-xl border p-4">
					<Skeleton className="mb-3 h-5 w-3/4" />
					<Skeleton className="mb-2 h-4 w-full" />
					<Skeleton className="mb-4 h-4 w-2/3" />
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-8 w-20" />
					</div>
				</div>
			))}
		</div>
	);
}
