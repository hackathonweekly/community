"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from "react";

interface TruncatedTextProps {
	text: string;
	maxLines?: number;
	maxLength?: number;
	className?: string;
	showMoreText?: string;
	showLessText?: string;
	lineHeight?: number;
}

export function TruncatedText({
	text,
	maxLines = 3,
	maxLength = 200,
	className = "",
	showMoreText = "查看更多",
	showLessText = "收起",
}: TruncatedTextProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [canToggle, setCanToggle] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const clampedRef = useRef<HTMLParagraphElement>(null);
	const fullRef = useRef<HTMLParagraphElement>(null);

	if (!text) return null;

	const previewText = useMemo(() => {
		if (text.length <= maxLength) return text;
		return `${text.slice(0, maxLength)}...`;
	}, [text, maxLength]);

	const recomputeToggle = useCallback(() => {
		if (text.length > maxLength) {
			setCanToggle(true);
			return;
		}

		const clampedEl = clampedRef.current;
		const fullEl = fullRef.current;
		if (!clampedEl || !fullEl) return;

		const clampedHeight = clampedEl.getBoundingClientRect().height;
		const fullHeight = fullEl.getBoundingClientRect().height;
		setCanToggle(fullHeight - clampedHeight > 1);
	}, [text, maxLength]);

	useLayoutEffect(() => {
		// Only relevant in collapsed mode; expanded always shows full text.
		if (isExpanded) return;
		recomputeToggle();
	}, [isExpanded, recomputeToggle, previewText, maxLines]);

	useEffect(() => {
		const wrapperEl = wrapperRef.current;
		if (!wrapperEl || typeof ResizeObserver === "undefined") return;

		const ro = new ResizeObserver(() => {
			if (!isExpanded) recomputeToggle();
		});
		ro.observe(wrapperEl);
		return () => ro.disconnect();
	}, [isExpanded, recomputeToggle]);

	const clampStyle = useMemo<CSSProperties | undefined>(() => {
		if (isExpanded) return undefined;
		return {
			display: "-webkit-box",
			WebkitBoxOrient: "vertical",
			WebkitLineClamp: maxLines,
			overflow: "hidden",
			overflowWrap: "anywhere",
		};
	}, [isExpanded, maxLines]);

	return (
		<div ref={wrapperRef} className="relative">
			<div
				className={`transition-all duration-300 ease-in-out ${className}`}
			>
				<p
					ref={clampedRef}
					className="whitespace-pre-line break-words"
					style={clampStyle}
				>
					{isExpanded ? text : previewText}
				</p>
			</div>

			{/* Invisible full text for measuring overflow */}
			<p
				ref={fullRef}
				aria-hidden="true"
				className={`pointer-events-none absolute left-0 top-0 w-full whitespace-pre-line break-words opacity-0 ${className}`}
				style={{ overflowWrap: "anywhere" }}
			>
				{text}
			</p>

			{canToggle && (
				<div className="mt-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-auto p-1 text-xs font-medium text-primary hover:bg-primary/50 hover:text-primary-700 transition-colors"
					>
						<span className="mr-1">
							{isExpanded ? showLessText : showMoreText}
						</span>
						{isExpanded ? (
							<ChevronUp className="h-3 w-3 inline" />
						) : (
							<ChevronDown className="h-3 w-3 inline" />
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
