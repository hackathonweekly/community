"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { OrganizationMemberRole } from "@community/lib-server/auth";
import { UserPlus, Link2, Mail, Bell, Copy, Loader2 } from "lucide-react";
import {
	MemberSearchInput,
	type MemberSearchUser,
} from "@shared/components/MemberSearchInput";

import { SettingsItem } from "@shared/components/SettingsItem";
import { OrganizationRoleSelect } from "@account/organizations/components/OrganizationRoleSelect";
import {
	createOrganizationInvitation,
	fullOrganizationQueryKey,
	organizationInvitationsQueryKey,
	type CreateOrganizationInvitationPayload,
	type OrganizationInvitationSummary,
} from "@account/organizations/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Button } from "@community/ui/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@community/ui/ui/form";
import { Input } from "@community/ui/ui/input";
import { Label } from "@community/ui/ui/label";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";

const INVITABLE_ROLES: OrganizationMemberRole[] = ["member", "admin"];

const emailInviteSchema = z.object({
	email: z.string().email("请输入有效邮箱"),
	role: z.enum(["member", "admin"]),
});

const directInviteSchema = z.object({
	userId: z.string().min(1, "请选择用户"),
	role: z.enum(["member", "admin"]),
});

type EmailInviteValues = z.infer<typeof emailInviteSchema>;
type DirectInviteValues = z.infer<typeof directInviteSchema>;

export function InviteMemberForm({
	organizationId,
	organizationSlug,
	onMemberAdded,
}: {
	organizationId: string;
	organizationSlug: string;
	onMemberAdded?: () => void;
}) {
	const queryClient = useQueryClient();

	const emailForm = useForm<EmailInviteValues>({
		resolver: zodResolver(emailInviteSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	const directForm = useForm<DirectInviteValues>({
		resolver: zodResolver(directInviteSchema),
		defaultValues: {
			userId: "",
			role: "member",
		},
	});

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<MemberSearchUser | null>(
		null,
	);
	const [generatedInvitation, setGeneratedInvitation] =
		useState<OrganizationInvitationSummary | null>(null);
	const [lastAction, setLastAction] = useState<"link" | "email" | "in-app">(
		"link",
	);
	const [pendingAction, setPendingAction] = useState<
		"link" | "email" | "in-app" | null
	>(null);
	const [linkRole, setLinkRole] = useState<"member" | "admin">("member");

	const formatter = new Intl.DateTimeFormat("zh-CN", {
		dateStyle: "medium",
		timeStyle: "short",
	});

	const clearSelection = () => {
		setSelectedUser(null);
		directForm.setValue("userId", "");
		setSearchQuery("");
	};

	const handleUserSelect = (user: MemberSearchUser) => {
		setSelectedUser(user);
		directForm.setValue("userId", user.id, { shouldDirty: true });
		setSearchQuery(user.name);
	};

	const handleCopy = async (value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success("邀请链接已复制");
		} catch {
			toast.error("复制失败，请手动复制链接");
		}
	};

	const invitationMutation = useMutation({
		mutationFn: async (payload: CreateOrganizationInvitationPayload) => {
			if (!organizationSlug) {
				throw new Error("缺少组织标识，无法生成邀请");
			}
			return createOrganizationInvitation({
				slug: organizationSlug,
				payload,
			});
		},
		onSuccess: (invitation, payload) => {
			const action = payload.email
				? "email"
				: payload.targetUserId
					? "in-app"
					: "link";

			setGeneratedInvitation(invitation);
			setLastAction(action);
			setPendingAction(null);

			queryClient.invalidateQueries({
				queryKey: fullOrganizationQueryKey(organizationId),
			});
			queryClient.invalidateQueries({
				queryKey: organizationInvitationsQueryKey(organizationSlug),
			});
			onMemberAdded?.();

			if (action === "email") {
				emailForm.reset({ email: "", role: payload.role });
				toast.success("已发送邮箱邀请，并生成备用链接");
			} else if (action === "in-app") {
				clearSelection();
				directForm.reset({ userId: "", role: "member" });
				toast.success("站内邀请已发送，对方会收到通知");
			} else {
				toast.success("邀请链接已生成");
			}
		},
		onError: (error) => {
			setPendingAction(null);
			toast.error(error instanceof Error ? error.message : "邀请失败");
		},
	});

	const handleLinkGeneration = () => {
		setPendingAction("link");
		invitationMutation.mutate({ role: linkRole });
	};

	const handleEmailSubmit = emailForm.handleSubmit((values) => {
		setPendingAction("email");
		invitationMutation.mutate(values);
	});

	const handleDirectSubmit = directForm.handleSubmit((values) => {
		setPendingAction("in-app");
		invitationMutation.mutate({
			role: values.role,
			targetUserId: values.userId,
		});
	});

	const InvitationPreview = ({
		invitation,
		action,
	}: {
		invitation: OrganizationInvitationSummary;
		action: "link" | "email" | "in-app";
	}) => {
		const expiresLabel = formatter.format(new Date(invitation.expiresAt));
		const actionLabel =
			action === "email"
				? "邮箱邀请已发送"
				: action === "in-app"
					? "站内邀请已发送"
					: "邀请链接已生成";
		const actionIcon =
			action === "email" ? (
				<Mail className="h-4 w-4 text-primary" />
			) : action === "in-app" ? (
				<Bell className="h-4 w-4 text-primary" />
			) : (
				<Link2 className="h-4 w-4 text-primary" />
			);

		return (
			<div className="space-y-3 rounded-lg border border-dashed bg-muted/40 p-4">
				<div className="flex items-center gap-2 text-sm font-medium">
					{actionIcon}
					<span>{actionLabel}</span>
				</div>
				<p className="text-xs text-muted-foreground">
					链接将在 {expiresLabel} 过期
				</p>
				{action === "email" && invitation.email && (
					<p className="text-sm">
						已发送至：
						<span className="font-medium">{invitation.email}</span>
					</p>
				)}
				{action === "in-app" && invitation.targetUser && (
					<div className="flex items-center gap-2 text-sm">
						<Avatar className="h-6 w-6">
							<AvatarImage
								src={invitation.targetUser.image ?? undefined}
							/>
							<AvatarFallback>
								{invitation.targetUser.name?.[0]?.toUpperCase() ||
									"U"}
							</AvatarFallback>
						</Avatar>
						<span className="font-medium">
							{invitation.targetUser.name ||
								invitation.targetUser.username}
						</span>
						{invitation.targetUser.email && (
							<span className="text-muted-foreground">
								({invitation.targetUser.email})
							</span>
						)}
					</div>
				)}
				<div className="space-y-1">
					<Label className="text-xs text-muted-foreground">
						邀请链接
					</Label>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Input
							readOnly
							value={invitation.shareUrl}
							className="font-mono text-xs"
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => handleCopy(invitation.shareUrl)}
						>
							<Copy className="mr-1 h-4 w-4" /> 复制链接
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						分享给未完成资料的成员时，也可以提醒他们尽快完善资料
					</p>
				</div>
			</div>
		);
	};

	return (
		<SettingsItem
			title="邀请成员"
			description="生成链接、发送邮件或站内通知，邀请成员加入组织"
			layout="stacked"
		>
			<Tabs defaultValue="link" className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="link">邀请链接</TabsTrigger>
					<TabsTrigger value="email">邮箱邀请</TabsTrigger>
					<TabsTrigger value="in-app">站内邀请</TabsTrigger>
				</TabsList>

				<TabsContent value="link" className="space-y-4">
					<div className="space-y-2">
						<Label>邀请角色</Label>
						<div className="max-w-xs">
							<OrganizationRoleSelect
								value={linkRole}
								onSelect={(value) =>
									setLinkRole(
										(value as "member" | "admin") ??
											"member",
									)
								}
								allowedRoles={INVITABLE_ROLES}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							生成链接后分享给对方，完成资料后即可加入组织
						</p>
					</div>
					<div className="flex justify-end">
						<Button
							type="button"
							onClick={handleLinkGeneration}
							disabled={pendingAction !== null}
						>
							{pendingAction === "link" &&
							invitationMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									生成中...
								</>
							) : (
								"生成邀请链接"
							)}
						</Button>
					</div>
					{generatedInvitation && lastAction === "link" && (
						<InvitationPreview
							invitation={generatedInvitation}
							action="link"
						/>
					)}
				</TabsContent>

				<TabsContent value="email" className="space-y-4">
					<Form {...emailForm}>
						<form
							className="space-y-4"
							onSubmit={handleEmailSubmit}
						>
							<FormField
								control={emailForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>收件邮箱</FormLabel>
										<FormControl>
											<Input
												placeholder="member@example.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={emailForm.control}
								name="role"
								render={({ field }) => (
									<FormItem className="max-w-xs">
										<FormLabel>邀请角色</FormLabel>
										<FormControl>
											<OrganizationRoleSelect
												value={field.value}
												onSelect={(value) =>
													emailForm.setValue(
														"role",
														value as
															| "member"
															| "admin",
													)
												}
												allowedRoles={INVITABLE_ROLES}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={pendingAction !== null}
								>
									{pendingAction === "email" &&
									invitationMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											发送中...
										</>
									) : (
										"发送邀请"
									)}
								</Button>
							</div>
						</form>
					</Form>

					{generatedInvitation && lastAction === "email" && (
						<InvitationPreview
							invitation={generatedInvitation}
							action="email"
						/>
					)}
				</TabsContent>

				<TabsContent value="in-app" className="space-y-4">
					<Form {...directForm}>
						<form
							className="space-y-4"
							onSubmit={handleDirectSubmit}
						>
							<div className="space-y-2">
								<Label htmlFor="userSearch">搜索用户</Label>
								<MemberSearchInput
									id="userSearch"
									value={searchQuery}
									onValueChange={(query) => {
										setSearchQuery(query);
										if (selectedUser) {
											setSelectedUser(null);
											directForm.setValue("userId", "");
										}
									}}
									onSelect={handleUserSelect}
									placeholder="输入姓名、用户名或手机号"
								/>
							</div>

							<FormField
								control={directForm.control}
								name="role"
								render={({ field }) => (
									<FormItem className="max-w-xs">
										<FormLabel>邀请角色</FormLabel>
										<FormControl>
											<OrganizationRoleSelect
												value={field.value}
												onSelect={(value) =>
													directForm.setValue(
														"role",
														value as
															| "member"
															| "admin",
													)
												}
												allowedRoles={INVITABLE_ROLES}
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							<Button
								type="submit"
								className="flex items-center"
								disabled={
									pendingAction !== null || !selectedUser
								}
							>
								{pendingAction === "in-app" &&
								invitationMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										发送中...
									</>
								) : (
									<>
										<UserPlus className="mr-2 h-4 w-4" />
										发送邀请
									</>
								)}
							</Button>
						</form>
					</Form>

					{selectedUser && (
						<div className="flex items-center justify-between rounded-md border border-primary/50 bg-primary/5 p-3 text-sm">
							<div className="flex items-center gap-2">
								<Avatar className="h-8 w-8">
									<AvatarImage src={selectedUser.image} />
									<AvatarFallback>
										{selectedUser.name[0]?.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium leading-tight">
										{selectedUser.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{selectedUser.username &&
											`@${selectedUser.username}`}
									</p>
								</div>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={clearSelection}
							>
								清除
							</Button>
						</div>
					)}

					{generatedInvitation && lastAction === "in-app" && (
						<InvitationPreview
							invitation={generatedInvitation}
							action="in-app"
						/>
					)}
				</TabsContent>
			</Tabs>
		</SettingsItem>
	);
}
