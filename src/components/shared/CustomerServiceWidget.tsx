"use client";

import { HeadphonesIcon, QrCodeIcon, BookOpenIcon } from "lucide-react";
import { useState } from "react";
import { CustomerServiceModal } from "./CustomerServiceModal";
import { useCustomerServiceConfig } from "@/hooks/useSiteConfig";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CustomerServiceWidgetProps {
	className?: string;
	variant?: "floating" | "inline";
}

export function CustomerServiceWidget({
	className,
	variant = "floating",
}: CustomerServiceWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);
	const { data: customerServiceConfig } = useCustomerServiceConfig();

	if (!customerServiceConfig.enabled) {
		return null;
	}

	const handleClick = () => {
		setIsOpen(true);
	};

	if (variant === "floating") {
		return (
			<>
				<Button
					onClick={handleClick}
					className={cn(
						"fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
						"bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
						"border border-white/20 backdrop-blur-sm",
						"hidden md:flex", // 只在桌面端显示
						className,
					)}
					size="icon"
					aria-label="客服与反馈"
				>
					<HeadphonesIcon className="h-6 w-6 text-white" />
				</Button>

				<CustomerServiceModal
					isOpen={isOpen}
					onClose={() => setIsOpen(false)}
					config={customerServiceConfig}
				/>
			</>
		);
	}

	// Inline variant
	return (
		<>
			<Button
				onClick={handleClick}
				variant="outline"
				className={cn("gap-2", className)}
			>
				<HeadphonesIcon className="h-4 w-4" />
				客服与反馈
			</Button>

			<CustomerServiceModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				config={customerServiceConfig}
			/>
		</>
	);
}

// Quick access buttons for different sections
export function CustomerServiceQuickActions({
	className,
}: { className?: string }) {
	const [activeModal, setActiveModal] = useState<"community" | "docs" | null>(
		null,
	);
	const { data: customerServiceConfig } = useCustomerServiceConfig();

	if (!customerServiceConfig.enabled) {
		return null;
	}

	return (
		<>
			<div className={cn("flex gap-2", className)}>
				{customerServiceConfig.community.enabled && (
					<Button
						onClick={() => setActiveModal("community")}
						variant="ghost"
						size="sm"
						className="gap-2"
					>
						<QrCodeIcon className="h-4 w-4" />
						加入社群
					</Button>
				)}

				{customerServiceConfig.feedback.docsIntegration && (
					<Button
						onClick={() => setActiveModal("docs")}
						variant="ghost"
						size="sm"
						className="gap-2"
					>
						<BookOpenIcon className="h-4 w-4" />
						查看文档
					</Button>
				)}
			</div>

			<CustomerServiceModal
				isOpen={activeModal !== null}
				onClose={() => setActiveModal(null)}
				defaultTab={activeModal || undefined}
				config={customerServiceConfig}
			/>
		</>
	);
}
