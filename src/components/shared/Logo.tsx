import { cn } from "@/lib/utils";
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
					src="/images/logo.png"
					alt="HackathonWeekly"
					className="h-8 md:h-10 w-auto object-contain"
					width={100}
					height={40}
					priority
				/>
				<span className="absolute bottom-0 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
					Beta
				</span>
			</div>
			{/* {withLabel && (
				<span className="ml-3 hidden text-lg md:block">HackathonWeekly</span>
			)} */}
		</span>
	);
}
