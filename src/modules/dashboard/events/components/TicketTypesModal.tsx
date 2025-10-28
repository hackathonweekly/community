"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { PlusIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useFieldArray } from "react-hook-form";

import type { TicketType } from "./types";

interface TicketTypesModalProps {
	control: any;
	ticketTypes: TicketType[];
	children: React.ReactNode;
}

export function TicketTypesModal({
	control,
	ticketTypes,
	children,
}: TicketTypesModalProps) {
	const [open, setOpen] = useState(false);

	const ticketTypeFields = useFieldArray({
		control,
		name: "ticketTypes",
	});

	const getTicketTypeSummary = () => {
		if (ticketTypes.length === 0) {
			return "免费参与";
		}
		return `${ticketTypes.length} 种票价`;
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UsersIcon className="w-5 h-5" />
						票种设置
					</DialogTitle>
					<DialogDescription>
						为不同角色设置不同的票种和价格（可选，默认免费参与）
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<Label>门票类型</Label>
								<p className="text-sm text-muted-foreground mt-1">
									设置不同角色的门票，每个票种都有独立的人数限制
								</p>
							</div>
						</div>

						{ticketTypeFields.fields.length === 0 && (
							<div className="text-center py-8 text-muted-foreground">
								<UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
								<p className="mb-2">活动默认免费参与</p>
								<p className="text-sm">
									如需为不同角色设置不同价格，请点击"添加票种"
								</p>
							</div>
						)}

						{ticketTypeFields.fields.map((field, index) => (
							<Card key={field.id} className="p-4">
								<div className="flex justify-between items-start mb-4">
									<Label>票种 {index + 1}</Label>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											ticketTypeFields.remove(index)
										}
									>
										<TrashIcon className="w-4 h-4" />
									</Button>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										control={control}
										name={`ticketTypes.${index}.name`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													票种名称 *
												</FormLabel>
												<FormControl>
													<Input
														placeholder="如：早鸟票、学生票、VIP票"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name={`ticketTypes.${index}.price`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>价格 (元)</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="0"
														step="0.01"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseFloat(
																	e.target
																		.value,
																) || 0,
															)
														}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
									<FormField
										control={control}
										name={`ticketTypes.${index}.quantity`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>票数量 *</FormLabel>
												<FormControl>
													<Input
														type="number"
														min="1"
														placeholder="10"
														{...field}
														onChange={(e) =>
															field.onChange(
																Number.parseInt(
																	e.target
																		.value,
																) || 1,
															)
														}
													/>
												</FormControl>
												<FormDescription>
													此票种的人数限制
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={control}
										name={`ticketTypes.${index}.description`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													描述 (可选)
												</FormLabel>
												<FormControl>
													<Input
														placeholder="票种说明，如适用人群等"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</Card>
						))}

						{/* 添加票种按钮 */}
						<Button
							type="button"
							variant="outline"
							className="w-full"
							onClick={() =>
								ticketTypeFields.append({
									name: "",
									description: "",
									price: 0,
									quantity: 10,
								})
							}
						>
							<PlusIcon className="w-4 h-4 mr-2" />
							添加票种
						</Button>
					</div>

					{/* <div className="flex justify-end gap-2 pt-4 border-t">
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							关闭
						</Button>
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function TicketTypesSummary({
	ticketTypes,
}: { ticketTypes: TicketType[] }) {
	if (ticketTypes.length === 0) {
		return <div className="text-sm text-muted-foreground">免费参与</div>;
	}

	return (
		<div className="space-y-2">
			{ticketTypes.map((ticket, index) => (
				<div
					key={index}
					className="flex items-center justify-between text-sm"
				>
					<span>{ticket.name}</span>
					<div className="flex items-center gap-2">
						<Badge variant="outline">¥{ticket.price}</Badge>
						<span className="text-muted-foreground">
							{ticket.quantity}张
						</span>
					</div>
				</div>
			))}
		</div>
	);
}
