import type { ElementType } from "react";

export function HeroMeta({
	icon: Icon,
	primary,
	secondary,
}: {
	icon: ElementType;
	primary: string;
	secondary?: string;
}) {
	return (
		<span className="inline-flex items-start gap-2 rounded-full bg-white/10 px-3 py-2">
			<Icon className="h-4 w-4 mt-0.5" />
			<span className="flex flex-col">
				<span className="font-medium leading-tight">{primary}</span>
				{secondary ? (
					<span className="text-xs text-white/80 leading-snug">
						{secondary}
					</span>
				) : null}
			</span>
		</span>
	);
}
