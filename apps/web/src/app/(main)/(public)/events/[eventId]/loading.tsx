import { Skeleton } from "@community/ui/ui/skeleton";

export default function Loading() {
	return (
		<div className="min-h-screen bg-slate-50 pb-20 lg:pb-0">
			<div className="relative isolate overflow-hidden bg-slate-900 text-white min-h-[200px] md:min-h-[240px] lg:min-h-[260px]">
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
				<div className="relative container max-w-6xl py-10 space-y-4">
					<Skeleton className="h-6 w-36 bg-white/15" />
					<Skeleton className="h-10 w-3/4 bg-white/15" />
					<div className="flex flex-wrap gap-2 pt-1">
						<Skeleton className="h-6 w-20 rounded-full bg-white/15" />
						<Skeleton className="h-6 w-24 rounded-full bg-white/15" />
						<Skeleton className="h-6 w-16 rounded-full bg-white/15" />
					</div>
					<div className="flex gap-3 pt-3">
						<Skeleton className="h-9 w-28 bg-white/15" />
						<Skeleton className="h-9 w-24 bg-white/15" />
					</div>
				</div>
			</div>

			<div className="container max-w-6xl py-6">
				<div className="flex flex-wrap gap-3">
					<Skeleton className="h-10 w-28 rounded-full" />
					<Skeleton className="h-10 w-28 rounded-full" />
					<Skeleton className="h-10 w-28 rounded-full" />
				</div>

				<div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
					<div className="lg:col-span-2 space-y-6">
						<div className="flex gap-2">
							<Skeleton className="h-10 w-24 rounded-full" />
							<Skeleton className="h-10 w-24 rounded-full" />
							<Skeleton className="h-10 w-24 rounded-full" />
						</div>
						<div className="rounded-2xl border bg-white p-6 shadow-sm">
							<Skeleton className="h-5 w-40" />
							<div className="mt-4 space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
								<Skeleton className="h-4 w-2/3" />
							</div>
						</div>
					</div>

					<div className="hidden lg:flex flex-col gap-6">
						<div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-9 w-full" />
						</div>
						<div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-12 w-12 rounded-full" />
							<Skeleton className="h-4 w-2/3" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
