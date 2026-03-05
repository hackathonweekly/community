import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none [&>svg]:size-3 [&>svg]:pointer-events-none",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-border bg-muted text-muted-foreground [a&]:hover:bg-muted/80",
				destructive:
					"border-red-200 bg-red-50 text-red-700 [a&]:hover:bg-red-100",
				success:
					"border-green-200 bg-green-50 text-green-700 [a&]:hover:bg-green-100",
				warning:
					"border-amber-200 bg-amber-50 text-amber-700 [a&]:hover:bg-amber-100",
				info: "border-blue-200 bg-blue-50 text-blue-700 [a&]:hover:bg-blue-100",
				outline:
					"border-border bg-background text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			data-slot="badge"
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
