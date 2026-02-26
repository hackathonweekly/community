"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Info } from "lucide-react";

import { Button } from "@community/ui/ui/button";
import { cn } from "@community/lib-shared/utils";
import type {
	ProfileRequirementStatus,
	UserProfileValidation,
} from "@community/lib-shared/utils/profile-validation";

interface ProfileCompletionNoticeProps {
	validation: UserProfileValidation;
	variant?: "compact" | "card";
	actionLabel?: string;
	actionHref?: string;
	onAction?: () => void;
	onFixField?: (field: ProfileRequirementStatus) => void;
	className?: string;
}

export function ProfileCompletionNotice({
	validation,
	variant = "card",
	actionLabel,
	actionHref,
	onAction,
	onFixField,
	className,
}: ProfileCompletionNoticeProps) {
	if (validation.isComplete) {
		return null;
	}
	const missingRequired = useMemo(
		() => validation.requiredFields.filter((field) => !field.isComplete),
		[validation.requiredFields],
	);
	const containerClass = cn(
		"rounded-lg border border-amber-200 bg-amber-50 transition-colors dark:border-amber-900/60 dark:bg-amber-900/20",
		variant === "card" ? "p-4" : "p-3",
		className,
	);

	const TitleIcon = Info;
	const iconClass = cn(
		variant === "card" ? "h-5 w-5" : "h-4 w-4",
		"text-amber-600",
	);

	const resolvedActionLabel = actionLabel || "完善资料";

	const actionButton = (() => {
		if (!resolvedActionLabel || (!actionHref && !onAction)) {
			return null;
		}

		if (actionHref) {
			return (
				<Button
					size={variant === "compact" ? "sm" : "default"}
					className="rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
					asChild
				>
					<Link href={actionHref}>{resolvedActionLabel}</Link>
				</Button>
			);
		}

		return (
			<Button
				size={variant === "compact" ? "sm" : "default"}
				onClick={onAction}
				className="rounded-full bg-black px-4 text-xs font-bold text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-muted"
			>
				{resolvedActionLabel}
			</Button>
		);
	})();

	const progressSection = (
		<div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-amber-100/80">
			<span>
				{validation.completedCount}/{validation.totalRequiredFields}
			</span>
			<div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all bg-amber-500"
					style={{ width: `${validation.completionPercentage}%` }}
				/>
			</div>
			<span>{validation.completionPercentage}%</span>
		</div>
	);

	const MissingFieldChip = ({
		field,
	}: {
		field: ProfileRequirementStatus;
	}) => (
		<Button
			key={field.key}
			variant="outline"
			size="sm"
			className="h-7 rounded-full border-amber-300 bg-white px-3 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
			onClick={() => onFixField?.(field)}
			disabled={!onFixField}
		>
			{field.label}
		</Button>
	);

	return (
		<div className={containerClass}>
			<div
				className={cn(
					"flex gap-3",
					variant === "compact"
						? "flex-col sm:flex-row sm:items-center sm:justify-between"
						: "flex-col",
				)}
			>
				<div className="flex items-start gap-3">
					<TitleIcon className={iconClass} />
					<div className="space-y-1 text-sm text-foreground">
						<div className="font-bold">资料待完善</div>
						<div className="text-xs leading-relaxed text-amber-700 dark:text-amber-100/90">
							{validation.missingCount === 1
								? `还需要完善 1 项信息：${validation.missingFields[0]}`
								: `还需要完善 ${validation.missingCount} 项信息，包括：${validation.missingFields
										.slice(0, 3)
										.join("、")}${
										validation.missingCount > 3 ? "等" : ""
									}`}
						</div>
					</div>
				</div>
				{actionButton}
			</div>

			{missingRequired.length > 0 && (
				<div className="mt-3">
					<div className="text-xs font-bold text-amber-700 dark:text-amber-100/90">
						待完善的必填项：
					</div>
					<div className="mt-2 flex flex-wrap gap-2">
						{missingRequired.map((field) => (
							<MissingFieldChip key={field.key} field={field} />
						))}
					</div>
				</div>
			)}

			<div
				className={cn(
					"mt-3",
					variant === "compact" ? "sm:max-w-sm" : "max-w-sm",
				)}
			>
				{progressSection}
			</div>
		</div>
	);
}
