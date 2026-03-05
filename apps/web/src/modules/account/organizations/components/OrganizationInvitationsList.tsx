"use client";

import { authClient } from "@community/lib-client/auth/client";
import { isOrganizationAdmin } from "@community/lib-shared/auth/lib/helper";
import { useSession } from "@account/auth/hooks/use-session";
import {
	fullOrganizationQueryKey,
	organizationInvitationsQueryKey,
	useFullOrganizationQuery,
	useOrganizationInvitationsQuery,
	type OrganizationInvitationSummary,
} from "@account/organizations/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Button } from "@community/ui/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@community/ui/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableRow } from "@community/ui/ui/table";
import {
	CheckIcon,
	ClockIcon,
	Copy,
	MailXIcon,
	MoreVerticalIcon,
	XIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

const statusIconMap: Record<string, typeof ClockIcon> = {
	pending: ClockIcon,
	accepted: CheckIcon,
	rejected: XIcon,
	canceled: XIcon,
};

export function OrganizationInvitationsList({
	organizationId,
	organizationSlug,
}: {
	organizationId: string;
	organizationSlug?: string;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { user } = useSession();
	const formatter = useFormatter();

	const { data: organization } = useFullOrganizationQuery(organizationId);
	const slug = organizationSlug ?? organization?.slug;

	const { data: invitationList = [], isLoading } =
		useOrganizationInvitationsQuery(slug, {
			enabled: Boolean(slug),
		});

	const canUserEditInvitations = isOrganizationAdmin(organization, user);

	const invitations = useMemo(
		() =>
			invitationList.filter(
				(invitation) => invitation.status === "pending",
			),
		[invitationList],
	);

	const handleCopy = useCallback(async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success("邀请链接已复制");
		} catch {
			toast.error("复制失败，请稍后再试");
		}
	}, []);

	const revokeInvitation = useCallback(
		(invitationId: string) => {
			if (!slug) {
				return;
			}

			toast.promise(
				async () => {
					const { error } =
						await authClient.organization.cancelInvitation({
							invitationId,
						});

					if (error) {
						throw error;
					}
				},
				{
					loading: t(
						"organizations.settings.members.notifications.revokeInvitation.loading.description",
					),
					success: () => {
						queryClient.invalidateQueries({
							queryKey: organizationInvitationsQueryKey(slug),
						});
						queryClient.invalidateQueries({
							queryKey: fullOrganizationQueryKey(organizationId),
						});
						return t(
							"organizations.settings.members.notifications.revokeInvitation.success.description",
						);
					},
					error: t(
						"organizations.settings.members.notifications.revokeInvitation.error.description",
					),
				},
			);
		},
		[organizationId, queryClient, slug, t],
	);

	const columns: ColumnDef<OrganizationInvitationSummary>[] = useMemo(
		() => [
			{
				id: "recipient",
				header: "受邀对象",
				cell: ({ row }) => {
					const invitation = row.original;
					const StatusIcon =
						statusIconMap[invitation.status] ?? ClockIcon;
					const displayEmail =
						invitation.email ?? invitation.metadata.originalEmail;
					const recipientLabel =
						invitation.targetUser?.name ||
						displayEmail ||
						"通用邀请链接";
					const secondaryLine =
						invitation.targetUser?.email &&
						invitation.targetUser.email !== displayEmail
							? invitation.targetUser.email
							: displayEmail;

					return (
						<div className="leading-tight">
							<div className="flex items-center gap-2">
								<StatusIcon className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">
									{recipientLabel}
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								{t(
									"organizations.settings.members.invitations.expiresAt",
									{
										date: formatter.dateTime(
											new Date(invitation.expiresAt),
											{
												dateStyle: "medium",
												timeStyle: "short",
											},
										),
									},
								)}
							</div>
							{secondaryLine && (
								<div className="text-xs text-muted-foreground">
									{secondaryLine}
								</div>
							)}
							{invitation.linkType && (
								<div className="text-xs text-muted-foreground">
									类型：{invitation.linkType}
								</div>
							)}
							{Array.isArray(
								invitation.metadata.pendingProfileMissing,
							) &&
								invitation.metadata.pendingProfileMissing
									.length > 0 && (
									<div className="text-xs text-amber-600">
										待完善：
										{invitation.metadata.pendingProfileMissing.join(
											"、",
										)}
									</div>
								)}
						</div>
					);
				},
			},
			{
				accessorKey: "role",
				header: "角色",
				cell: ({ row }) => (
					<span className="text-sm uppercase text-muted-foreground">
						{row.original.role ?? "-"}
					</span>
				),
			},
			{
				id: "actions",
				header: "操作",
				cell: ({ row }) => {
					const invitation = row.original;
					const isPending = invitation.status === "pending";

					return (
						<div className="flex items-center justify-end gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleCopy(invitation.shareUrl)}
							>
								<Copy className="mr-1 h-4 w-4" />
								复制链接
							</Button>
							{canUserEditInvitations && isPending && (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="icon" variant="ghost">
											<MoreVerticalIcon className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onClick={() =>
												revokeInvitation(invitation.id)
											}
										>
											<MailXIcon className="mr-2 h-4 w-4" />
											{t(
												"organizations.settings.members.invitations.revoke",
											)}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					);
				},
			},
		],
		[canUserEditInvitations, formatter, handleCopy, revokeInvitation, t],
	);

	const table = useReactTable({
		data: invitations,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	if (!slug) {
		return (
			<div className="py-6 text-center text-sm text-muted-foreground">
				加载组织邀请中...
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-base font-medium">
					{t("organizations.settings.members.invitations.title")}
				</h3>
			</div>

			<div className="overflow-hidden rounded-md border">
				<Table>
					<thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-4 py-2 text-left font-medium"
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef
														.header,
													header.getContext(),
												)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<TableBody>
						{isLoading ? (
							<tr>
								<TableCell
									colSpan={columns.length}
									className="px-4 py-6 text-center text-sm text-muted-foreground"
								>
									加载中...
								</TableCell>
							</tr>
						) : table.getRowModel().rows.length > 0 ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="px-4 py-3 align-middle"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<tr>
								<TableCell
									colSpan={columns.length}
									className="px-4 py-6 text-center text-sm text-muted-foreground"
								>
									暂无待处理邀请
								</TableCell>
							</tr>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
