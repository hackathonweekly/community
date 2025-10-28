"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

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
	lineHeight = 1.5,
}: TruncatedTextProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	if (!text) return null;

	// 计算字符截断点
	const shouldTruncateByLength = text.length > maxLength;
	const estimatedHeight = lineHeight * 1.6; // 估算每行高度（rem）
	const containerStyle = {
		maxHeight: isExpanded ? "none" : `${estimatedHeight * maxLines}rem`,
	};

	const needsTruncation = shouldTruncateByLength;

	return (
		<div className="relative">
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${className}`}
				style={containerStyle}
			>
				<p className="whitespace-pre-line">
					{isExpanded || !needsTruncation
						? text
						: `${text.slice(0, maxLength)}...`}
				</p>
			</div>

			{needsTruncation && (
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
