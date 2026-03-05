import { cn } from "../lib/utils";
import Image from "next/image";

export function Logo({
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<div className="relative mr-4 md:mr-8">
				<Image
					src="/images/logo-black.png"
					alt="HackathonWeekly"
					className="h-10 md:h-12 w-auto object-contain dark:hidden"
					width={120}
					height={48}
					priority
				/>
				<Image
					src="/images/logo-white.png"
					alt="HackathonWeekly"
					className="h-10 md:h-12 w-auto object-contain hidden dark:block"
					width={120}
					height={48}
					priority
				/>
			</div>
			{/* {withLabel && (
				<span className="ml-3 hidden text-lg md:block">HackathonWeekly</span>
			)} */}
		</span>
	);
}
