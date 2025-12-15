import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
			<div className="relative isolate overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
				<div className="relative container max-w-6xl py-12 space-y-4">
					<Skeleton className="h-6 w-40 bg-white/20" />
					<Skeleton className="h-10 w-3/4 bg-white/20" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-72 bg-white/20" />
						<Skeleton className="h-4 w-56 bg-white/20" />
					</div>
					<div className="flex gap-3 pt-2">
						<Skeleton className="h-11 w-32 bg-white/20" />
						<Skeleton className="h-11 w-40 bg-white/20" />
						<Skeleton className="h-11 w-20 bg-white/20" />
					</div>
				</div>
			</div>

			<div className="container max-w-6xl py-10 space-y-8">
				{Array.from({ length: 5 }).map((_, idx) => (
					<div
						key={idx}
						className="rounded-2xl border bg-white p-6 shadow-sm"
					>
						<Skeleton className="h-5 w-40" />
						<div className="mt-4 space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-5/6" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
