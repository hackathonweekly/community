"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Button } from "@community/ui/ui/button";
import { Label } from "@community/ui/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import { EmailComposerForm } from "@/modules/account/emails/components/EmailComposerForm";
import type { EmailTemplateOption } from "@/modules/account/emails/components/EmailComposerForm";
import { Mail, Send, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

interface OrganizationMember {
	id: string;
	name: string;
	email: string;
	role: string;
	membershipLevel?: string | null;
	userRoleString?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
	owner: "组织拥有者",
	admin: "管理员",
	member: "普通成员",
};

export function OrganizationEmailDashboard() {
	const params = useParams();
	const organizationSlug = (params.slug ?? params.organizationSlug) as string;
	const [members, setMembers] = useState<OrganizationMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	// 邮件表单状态
	const [emailType, setEmailType] = useState<string>("");
	const [subject, setSubject] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [membershipFilter, setMembershipFilter] = useState<string>("all");

	const roleOptions = useMemo(
		() =>
			Array.from(
				new Set(members.map((member) => member.role).filter(Boolean)),
			),
		[members],
	);

	const membershipOptions = useMemo(
		() =>
			Array.from(
				new Set(
					members
						.map((member) => member.membershipLevel)
						.filter(
							(level): level is string =>
								!!level && level.trim().length > 0,
						),
				),
			),
		[members],
	);

	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			const roleMatch =
				roleFilter === "all" || member.role === roleFilter;
			const membershipMatch =
				membershipFilter === "all" ||
				member.membershipLevel === membershipFilter;
			return roleMatch && membershipMatch;
		});
	}, [members, roleFilter, membershipFilter]);

	const filteredAdminCount = useMemo(
		() =>
			filteredMembers.filter(
				(member) => member.role === "admin" || member.role === "owner",
			).length,
		[filteredMembers],
	);

	const filteredMemberCount = useMemo(
		() =>
			filteredMembers.filter((member) => member.role === "member").length,
		[filteredMembers],
	);

	// 邮件模板选项
	const emailTemplates: EmailTemplateOption[] = [
		{
			value: "announcement",
			label: "📢 重要公告",
			defaultSubject: "【组织公告】重要通知",
			defaultContent:
				"亲爱的组织成员，\n\n我们有重要信息需要与您分享：\n\n[请在此处填写公告内容]\n\n感谢您对组织的支持！\n\n此致\n组织管理团队",
		},
		{
			value: "event",
			label: "🎉 活动通知",
			defaultSubject: "【活动通知】精彩活动等您参与",
			defaultContent:
				"亲爱的组织成员，\n\n我们即将举办一场精彩的活动，诚邀您参与：\n\n活动名称：[活动名称]\n活动时间：[活动时间]\n活动地点：[活动地点]\n\n请及时报名参与！\n\n此致\n组织管理团队",
		},
		{
			value: "update",
			label: "📝 组织动态",
			defaultSubject: "【组织动态】近期更新",
			defaultContent:
				"亲爱的组织成员，\n\n与您分享组织的最新动态：\n\n[请在此处填写动态内容]\n\n感谢您的关注！\n\n此致\n组织管理团队",
		},
	];

	useEffect(() => {
		fetchMembers();
	}, []);

	const fetchMembers = async () => {
		try {
			const response = await fetch(
				`/api/organizations/${organizationSlug}/members`,
			);
			if (response.ok) {
				const data = await response.json();
				// 过滤出有邮箱的成员
				const membersWithEmail = (data.members || [])
					.filter((member: any) => member.user?.email)
					.map((member: any) => ({
						id: member.user.id,
						name:
							member.user.name ||
							member.user.username ||
							"未知用户",
						email: member.user.email,
						role: member.role,
						membershipLevel: member.membershipLevel ?? null,
						userRoleString: member.user.userRoleString ?? null,
					}));
				setMembers(membersWithEmail);
			}
		} catch (error) {
			console.error("Failed to fetch organization members:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleTemplateSelect = (
		templateValue: string,
		template?: EmailTemplateOption,
	) => {
		setEmailType(templateValue);
		const targetTemplate =
			template ?? emailTemplates.find((t) => t.value === templateValue);

		if (targetTemplate) {
			setSubject(targetTemplate.defaultSubject ?? "");
			setContent(targetTemplate.defaultContent ?? "");
		} else {
			setSubject("");
			setContent("");
		}
	};

	const sendEmail = async () => {
		if (!emailType || !subject.trim() || !content.trim()) {
			alert("请填写完整的邮件信息");
			return;
		}

		if (members.length === 0) {
			alert("组织中没有可发送邮件的成员");
			return;
		}

		if (filteredMembers.length === 0) {
			alert("当前筛选条件下暂无可发送邮件的成员");
			return;
		}

		setSending(true);
		try {
			const response = await fetch(
				`/api/organizations/${organizationSlug}/admin/emails/send`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						type: emailType,
						subject,
						content,
						recipients: filteredMembers.map(
							(member) => member.email,
						),
					}),
				},
			);

			if (response.ok) {
				alert(
					`邮件发送成功！已发送给 ${filteredMembers.length} 位组织成员`,
				);
				// 清空表单
				setEmailType("");
				setSubject("");
				setContent("");
			} else {
				const error = await response.json();
				alert(`发送失败：${error.message || "未知错误"}`);
			}
		} catch (error) {
			console.error("Failed to send email:", error);
			alert("发送失败，请稍后重试");
		} finally {
			setSending(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6">
				<div className="animate-pulse space-y-6">
					<div className="h-8 bg-muted rounded w-64" />
					<div className="h-96 bg-muted rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			{/* 页面标题 */}
			<div>
				<h1 className="text-3xl font-bold">邮件发送</h1>
				<p className="text-muted-foreground mt-2">
					向组织成员发送通知邮件
				</p>
			</div>

			{/* 成员统计 */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center">
						<Users className="w-5 h-5 mr-2" />
						收件人统计
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{filteredMembers.length}
							</div>
							<p className="text-sm text-muted-foreground">
								符合筛选条件的成员
							</p>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{filteredAdminCount}
							</div>
							<p className="text-sm text-muted-foreground">
								管理员 / 拥有者
							</p>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-muted-foreground">
								{filteredMemberCount}
							</div>
							<p className="text-sm text-muted-foreground">
								普通成员
							</p>
						</div>
					</div>
					<p className="mt-4 text-center text-sm text-muted-foreground">
						共有 {members.length} 名成员填写了邮箱地址。
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>筛选条件</CardTitle>
					<CardDescription>
						根据角色或成员身份筛选收件人，未选择时默认发送给所有有邮箱的成员。
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div>
							<Label className="mb-1 block">组织角色</Label>
							<Select
								value={roleFilter}
								onValueChange={setRoleFilter}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择角色" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部角色
									</SelectItem>
									{roleOptions.map((role) => (
										<SelectItem key={role} value={role}>
											{ROLE_LABELS[role] ?? role}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label className="mb-1 block">成员身份</Label>
							<Select
								value={membershipFilter}
								onValueChange={setMembershipFilter}
								disabled={membershipOptions.length === 0}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											membershipOptions.length === 0
												? "没有可选的成员身份"
												: "选择成员身份"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">
										全部身份
									</SelectItem>
									{membershipOptions.map((level) => (
										<SelectItem key={level} value={level}>
											{level}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			<EmailComposerForm
				title="发送邮件"
				description="选择模板并编辑内容，系统会自动跳过无法发送的邮箱"
				icon={<Mail className="w-5 h-5" />}
				templates={emailTemplates}
				selectedTemplate={emailType}
				onTemplateSelect={handleTemplateSelect}
				subject={subject}
				onSubjectChange={setSubject}
				content={content}
				onContentChange={setContent}
				disabled={members.length === 0 || !emailType}
				extraHeader={
					members.length === 0 ? (
						<div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
							组织中没有填写邮箱地址的成员，暂时无法发送邮件。
						</div>
					) : null
				}
			/>

			<div className="mt-4">
				<Button
					onClick={sendEmail}
					disabled={
						sending ||
						!emailType ||
						!subject.trim() ||
						!content.trim() ||
						filteredMembers.length === 0
					}
					className="w-full"
				>
					<Send className="w-4 h-4 mr-2" />
					{sending
						? "发送中..."
						: `发送给 ${filteredMembers.length} 位成员`}
				</Button>
			</div>
		</div>
	);
}
