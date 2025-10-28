import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
	title: string;
	icon: LucideIcon;
	value: string | number;
	subtitle: string;
	href?: string;
	isLoading?: boolean;
	error?: Error | null;
	onRetry?: () => void;
}

export function StatCard({
	title,
	icon: Icon,
	value,
	subtitle,
	href,
	isLoading = false,
	error = null,
	onRetry,
}: StatCardProps) {
	if (error) {
		return (
			<div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
				<div className="flex flex-col items-center justify-center text-center py-4">
					<AlertCircle className="h-8 w-8 text-red-500 mb-2" />
					<p className="text-sm text-red-600 mb-3">数据加载失败</p>
					{onRetry && (
						<Button
							onClick={onRetry}
							variant="outline"
							size="sm"
							className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							重试
						</Button>
					)}
				</div>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
				<div className="flex flex-col items-center text-center">
					<div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse mb-3" />
					<div className="h-6 w-12 bg-gray-200 animate-pulse rounded mb-2" />
					<div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
				</div>
			</div>
		);
	}

	const CardContent = () => (
		<>
			<div className="flex items-center justify-center mb-2 sm:mb-3">
				<div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
					<Icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
				</div>
			</div>
			<div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
				{value}
			</div>
			<div className="text-xs text-gray-600">{subtitle}</div>
		</>
	);

	return (
		<div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200">
			<h3 className="text-xs sm:text-sm font-medium text-gray-700 text-center mb-2 sm:mb-3">
				{title}
			</h3>
			{href ? (
				<a
					href={href}
					className="block text-center hover:text-blue-600 transition-colors group"
				>
					<CardContent />
				</a>
			) : (
				<div className="text-center">
					<CardContent />
				</div>
			)}
		</div>
	);
}
