"use client";

interface InteractiveBadgeProps {
	children: React.ReactNode;
	className?: string;
	scrollToTarget?: string; // Element ID to scroll to
}

export function InteractiveBadge({
	children,
	className,
	scrollToTarget,
}: InteractiveBadgeProps) {
	const handleClick = () => {
		if (scrollToTarget) {
			const element = document.getElementById(scrollToTarget);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	return (
		<div onClick={handleClick} className={className}>
			{children}
		</div>
	);
}
