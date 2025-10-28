"use client";

import { Button } from "@/components/ui/button";
import {
	Briefcase,
	GraduationCap,
	Search,
	UserCheck,
	Rocket,
	Compass,
} from "lucide-react";
import { useState } from "react";
import {
	LIFE_STATUS_OPTIONS,
	type LifeStatusValue,
} from "@/lib/utils/life-status";

// 为选项添加图标
const LIFE_STATUS_OPTIONS_WITH_ICONS = LIFE_STATUS_OPTIONS.map((option) => ({
	...option,
	icon:
		{
			EMPLOYED: Briefcase,
			JOB_SEEKING: Search,
			STUDENT: GraduationCap,
			FREELANCE: UserCheck,
			STARTUP: Rocket,
			EXPLORING: Compass,
		}[option.value as LifeStatusValue] || Briefcase,
}));

type LifeStatus = LifeStatusValue;

interface SimpleLifeStatusSelectorProps {
	lifeStatus?: string;
	onStatusChange: (status: string) => void;
}

export function SimpleLifeStatusSelector({
	lifeStatus,
	onStatusChange,
}: SimpleLifeStatusSelectorProps) {
	const [customStatus, setCustomStatus] = useState("");
	const [showCustomInput, setShowCustomInput] = useState(false);

	// 检查当前状态是否为预设状态
	const selectedOption = LIFE_STATUS_OPTIONS_WITH_ICONS.find(
		(option) => option.value === lifeStatus,
	);
	const isCustomStatus = lifeStatus && !selectedOption;

	const handlePresetStatusClick = (status: LifeStatus) => {
		onStatusChange(status);
		setShowCustomInput(false);
	};

	return (
		<div className="space-y-3">
			{/* 预设状态按钮 */}
			<div className="flex flex-wrap gap-2">
				{LIFE_STATUS_OPTIONS_WITH_ICONS.map((option) => {
					const isSelected = lifeStatus === option.value;
					const Icon = option.icon;

					return (
						<Button
							key={option.value}
							type="button"
							variant={isSelected ? "default" : "outline"}
							size="sm"
							className="h-8"
							onClick={() =>
								handlePresetStatusClick(option.value)
							}
						>
							<Icon className="h-3 w-3 mr-1" />
							{option.label}
						</Button>
					);
				})}

				{/* 自定义状态显示 */}
				{isCustomStatus && (
					<Button
						type="button"
						variant="default"
						size="sm"
						className="h-8"
						onClick={() => onStatusChange("")}
					>
						{lifeStatus} ×
					</Button>
				)}
			</div>

			{/* 自定义状态输入 */}
			{showCustomInput && (
				<div className="flex gap-2">
					<input
						type="text"
						placeholder="自定义状态"
						value={customStatus}
						onChange={(e) => setCustomStatus(e.target.value)}
						onKeyPress={(e) => {
							if (e.key === "Enter" && customStatus.trim()) {
								onStatusChange(customStatus.trim());
								setCustomStatus("");
								setShowCustomInput(false);
							}
						}}
						maxLength={10}
						className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
					<Button
						type="button"
						size="sm"
						onClick={() => {
							if (customStatus.trim()) {
								onStatusChange(customStatus.trim());
								setCustomStatus("");
								setShowCustomInput(false);
							}
						}}
						disabled={!customStatus.trim()}
					>
						确定
					</Button>
				</div>
			)}

			{/* 自定义按钮 */}
			{!showCustomInput && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setShowCustomInput(true)}
					className="h-6 text-xs"
				>
					+ 自定义
				</Button>
			)}
		</div>
	);
}
