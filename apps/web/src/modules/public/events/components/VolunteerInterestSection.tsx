"use client";

import { Checkbox } from "@community/ui/ui/checkbox";
import { Label } from "@community/ui/ui/label";
import { RadioGroup, RadioGroupItem } from "@community/ui/ui/radio-group";
import { HandRaisedIcon } from "@heroicons/react/24/outline";
import type { EventVolunteerRole } from "./types";

interface VolunteerInterestSectionProps {
	volunteerRoles?: EventVolunteerRole[];
	wantsToVolunteer: boolean;
	selectedRoleId: string;
	onWantsToVolunteerChange: (checked: boolean) => void;
	onSelectedRoleChange: (roleId: string) => void;
}

export const getAvailableVolunteerRoles = (
	volunteerRoles: EventVolunteerRole[] = [],
) =>
	volunteerRoles.filter((role) => {
		const activeApplications = role.registrations.filter(
			(registration) =>
				registration.status === "APPLIED" ||
				registration.status === "APPROVED",
		).length;
		return activeApplications < role.recruitCount;
	});

export async function applyForVolunteerRole(
	eventId: string,
	eventVolunteerRoleId: string,
) {
	const response = await fetch(`/api/events/${eventId}/volunteers/apply`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ eventVolunteerRoleId }),
	});
	const result = await response.json().catch(() => null);
	if (!response.ok) {
		throw new Error(result?.error || "志愿者申请提交失败");
	}
	return result;
}

export function VolunteerInterestSection({
	volunteerRoles,
	wantsToVolunteer,
	selectedRoleId,
	onWantsToVolunteerChange,
	onSelectedRoleChange,
}: VolunteerInterestSectionProps) {
	const availableRoles = getAvailableVolunteerRoles(volunteerRoles);
	if (availableRoles.length === 0) {
		return null;
	}

	const handleWantsToVolunteerChange = (checked: boolean) => {
		onWantsToVolunteerChange(checked);
		if (checked && availableRoles.length === 1) {
			onSelectedRoleChange(availableRoles[0].id);
		}
		if (!checked) {
			onSelectedRoleChange("");
		}
	};

	return (
		<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
			<div className="flex items-start gap-3">
				<Checkbox
					id="volunteer-interest"
					checked={wantsToVolunteer}
					onCheckedChange={(checked) =>
						handleWantsToVolunteerChange(checked === true)
					}
				/>
				<div className="min-w-0 flex-1 space-y-1">
					<Label
						htmlFor="volunteer-interest"
						className="flex cursor-pointer items-center gap-2 font-medium"
					>
						<HandRaisedIcon className="h-4 w-4" />
						我愿意报名成为本次活动志愿者
					</Label>
					<p className="text-xs text-muted-foreground">
						勾选后会与活动报名一起提交，组织者会另行确认分工。
					</p>
				</div>
			</div>

			{wantsToVolunteer && (
				<RadioGroup
					value={selectedRoleId}
					onValueChange={onSelectedRoleChange}
					className="mt-4 space-y-2 pl-7"
				>
					{availableRoles.map((role) => {
						const activeApplications = role.registrations.filter(
							(registration) =>
								registration.status === "APPLIED" ||
								registration.status === "APPROVED",
						).length;
						const remaining = Math.max(
							0,
							role.recruitCount - activeApplications,
						);
						return (
							<Label
								key={role.id}
								htmlFor={`volunteer-role-${role.id}`}
								className="flex cursor-pointer items-start gap-3 rounded-md border bg-background p-3 font-normal"
							>
								<RadioGroupItem
									id={`volunteer-role-${role.id}`}
									value={role.id}
									className="mt-0.5"
								/>
								<span className="min-w-0 flex-1">
									<span className="flex flex-wrap items-center gap-2 text-sm font-medium">
										{role.volunteerRole.name}
										<span className="text-xs font-normal text-muted-foreground">
											剩余 {remaining} 个名额
										</span>
									</span>
									{(role.description ||
										role.volunteerRole.description) && (
										<span className="mt-1 block text-xs text-muted-foreground">
											{role.description ||
												role.volunteerRole.description}
										</span>
									)}
								</span>
							</Label>
						);
					})}
				</RadioGroup>
			)}
		</div>
	);
}
