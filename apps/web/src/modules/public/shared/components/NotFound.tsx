"use client";

import { Button } from "@community/ui/ui/button";
import { UndoIcon } from "lucide-react";
import Link from "next/link";

export function NotFound() {
	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<h1 className="font-bold text-5xl">404</h1>
			<p className="mt-2 text-2xl">Page not found</p>

			<Button asChild className="mt-4">
				<Link href="/">
					<UndoIcon className="mr-2 size-4" /> Go to homepage
				</Link>
			</Button>
		</div>
	);
}
