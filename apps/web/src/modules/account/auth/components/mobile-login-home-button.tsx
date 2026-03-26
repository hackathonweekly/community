import { Button } from "@community/ui/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export function MobileLoginHomeButton() {
	return (
		<Button
			asChild
			variant="outline"
			size="sm"
			className="mb-4 inline-flex h-8 rounded-full px-3 text-muted-foreground shadow-none transition-colors hover:text-foreground lg:hidden"
		>
			<Link href="/">
				<ArrowLeftIcon className="size-4" />
				返回首页
			</Link>
		</Button>
	);
}
