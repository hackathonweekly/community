import { cn } from "@/lib/utils";

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
			<img
				src="/images/logo.png"
				alt="HackathonWeekly"
				className="w-auto object-contain"
				width={100}
				height={40}
				style={{ maxWidth: "100%", height: "auto" }}
			/>
			{/* {withLabel && (
				<span className="ml-3 hidden text-lg md:block">HackathonWeekly</span>
			)} */}
		</span>
	);
}
