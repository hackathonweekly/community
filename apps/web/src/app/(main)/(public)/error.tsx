"use client";

import { Button } from "@community/ui/ui/button";
import { useEffect } from "react";

export default function PublicLocaleError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="min-h-screen bg-slate-50">
			<div className="container max-w-3xl py-16 space-y-4">
				<h1 className="text-2xl font-semibold">服务端错误</h1>
				<p className="text-sm text-muted-foreground">
					服务器暂时不可用，请稍后再试。你可以重试或刷新页面。
				</p>
				<div className="flex gap-2">
					<Button onClick={reset}>重试</Button>
					<Button
						variant="outline"
						onClick={() => window.location.reload()}
					>
						刷新
					</Button>
				</div>
			</div>
		</div>
	);
}
