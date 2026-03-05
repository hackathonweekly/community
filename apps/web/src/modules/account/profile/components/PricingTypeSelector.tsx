"use client";

import { Label } from "@community/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@community/ui/ui/radio-group";
import { PricingType } from "@community/lib-shared/prisma-enums";
import { Banknote, Gift, Crown, Zap } from "lucide-react";

const PRICING_TYPE_OPTIONS = [
	{
		value: PricingType.FREE,
		label: "免费",
		description: "完全免费，无需付费",
		icon: Gift,
		color: "text-green-600",
		bgColor: "bg-green-50",
		borderColor: "border-green-200",
	},
	{
		value: PricingType.PAID,
		label: "付费",
		description: "需要一次性或订阅付费",
		icon: Banknote,
		color: "text-blue-600",
		bgColor: "bg-blue-50",
		borderColor: "border-blue-200",
	},
	{
		value: PricingType.FREEMIUM,
		label: "免费增值",
		description: "基础免费，高级功能收费",
		icon: Crown,
		color: "text-purple-600",
		bgColor: "bg-purple-50",
		borderColor: "border-purple-200",
	},
	{
		value: null,
		label: "暂未决定",
		description: "还在考虑定价策略",
		icon: Zap,
		color: "text-muted-foreground",
		bgColor: "bg-muted",
		borderColor: "border-border",
	},
];

interface PricingTypeSelectorProps {
	value: PricingType | null;
	onChange: (pricingType: PricingType | null) => void;
	showTitle?: boolean;
}

export function PricingTypeSelector({
	value,
	onChange,
	showTitle = true,
}: PricingTypeSelectorProps) {
	return (
		<div className="space-y-4">
			{showTitle && (
				<div>
					<h4 className="font-medium text-sm mb-1">定价模式</h4>
					<p className="text-xs text-muted-foreground">
						选择你的产品定价策略
					</p>
				</div>
			)}

			<RadioGroup
				value={value || "null"}
				onValueChange={(newValue) =>
					onChange(
						newValue === "null" ? null : (newValue as PricingType),
					)
				}
				className="grid grid-cols-2 gap-3"
			>
				{PRICING_TYPE_OPTIONS.map((option) => {
					const IconComponent = option.icon;
					const isSelected = value === option.value;

					return (
						<div key={option.value || "null"} className="relative">
							<Label
								htmlFor={option.value || "null"}
								className={`flex items-center space-x-3 rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-sm ${
									isSelected
										? `${option.borderColor} ${option.bgColor}`
										: "border-border bg-card hover:border-border"
								}`}
							>
								<RadioGroupItem
									value={option.value || "null"}
									id={option.value || "null"}
								/>
								<div className="flex-1 space-y-1">
									<div className="flex items-center gap-2">
										<IconComponent
											className={`h-4 w-4 ${isSelected ? option.color : "text-muted-foreground"}`}
										/>
										<Label
											htmlFor={option.value || "null"}
											className={`font-medium cursor-pointer text-sm ${
												isSelected
													? option.color
													: "text-foreground"
											}`}
										>
											{option.label}
										</Label>
									</div>
								</div>
							</Label>

							{/* Tooltip */}
							{isSelected && (
								<div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg whitespace-nowrap">
									{option.description}
									<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-popover" />
								</div>
							)}
						</div>
					);
				})}
			</RadioGroup>
		</div>
	);
}
