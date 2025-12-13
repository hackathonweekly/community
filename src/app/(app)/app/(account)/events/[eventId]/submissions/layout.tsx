import type { PropsWithChildren } from "react";

export default function SubmissionsLayout({ children }: PropsWithChildren) {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
				{children}
			</div>
		</div>
	);
}
