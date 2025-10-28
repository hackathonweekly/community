import type { OrganizationMemberRole } from "@/lib/auth";
import { useOrganizationMemberRoles } from "@dashboard/organizations/hooks/member-roles";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function OrganizationRoleSelect({
	value,
	onSelect,
	disabled,
	allowedRoles,
}: {
	value: OrganizationMemberRole;
	onSelect: (value: OrganizationMemberRole) => void;
	disabled?: boolean;
	allowedRoles?: OrganizationMemberRole[];
}) {
	const organizationMemberRoles = useOrganizationMemberRoles();

	const roleEntries = Object.entries(organizationMemberRoles).filter(
		([role]) =>
			!allowedRoles ||
			allowedRoles.includes(role as OrganizationMemberRole),
	);

	const roleOptions = roleEntries.map(([role, label]) => ({
		value: role,
		label,
	}));

	return (
		<Select value={value} onValueChange={onSelect} disabled={disabled}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{roleOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
