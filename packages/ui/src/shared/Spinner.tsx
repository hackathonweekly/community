import { cn } from "../lib/utils";
import { Loader2Icon } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
	return (
		<Loader2Icon
			className={cn("size-4 animate-spin text-primary", className)}
		/>
	);
}
