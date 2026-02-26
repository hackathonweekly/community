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
import { Checkbox } from "@community/ui/ui/checkbox";
import { EmailComposerForm } from "@/modules/account/emails/components/EmailComposerForm";
import type { EmailTemplateOption } from "@/modules/account/emails/components/EmailComposerForm";
import { Mail, Send, Users, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

interface User {
	id: string;
	name: string;
	email: string;
}

interface Organization {
	id: string;
	name: string;
	memberCount: number;
}

export function EmailManagementDashboard() {
	const [templateType, setTemplateType] = useState<string>("");
	const [subject, setSubject] = useState<string>("");
	const [content, setContent] = useState<string>("");
	const [users, setUsers] = useState<User[]>([]);
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [selectedOrganizations, setSelectedOrganizations] = useState<
		string[]
	>([]);
	const [selectAllUsers, setSelectAllUsers] = useState(false);
	const [loading, setLoading] = useState(false);
	const [sending, setSending] = useState(false);

	// 邮件模板选项
	const emailTemplates: EmailTemplateOption[] = [
		{ value: "announcement", label: "📢 公告" },
		{ value: "newsletter", label: "📰 周报" },
		{ value: "system", label: "🔧 系统通知" },
		{ value: "marketing", label: "📢 营销邮件" },
	];

	useEffect(() => {
		fetchUsers();
		fetchOrganizations();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			// 获取足够多的用户用于邮件发送，限制为1000个用户
			const response = await fetch("/api/super-admin/users?limit=1000");
			if (response.ok) {
				const data = await response.json();
				console.log("Users data:", data); // 调试日志
				// 确保用户数据格式正确
				const formattedUsers = (data.users || []).map((user: any) => ({
					id: user.id,
					name: user.name || user.username || user.email,
					email: user.email,
				}));
				setUsers(formattedUsers);
			} else {
				console.error(
					"Failed to fetch users:",
					response.status,
					response.statusText,
				);
				const errorText = await response.text();
				console.error("Error response:", errorText);
			}
		} catch (error) {
			console.error("Failed to fetch users:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchOrganizations = async () => {
		try {
			// 获取足够多的组织，限制为200个组织
			const response = await fetch("/api/admin/organizations?limit=200");
			if (response.ok) {
				const data = await response.json();
				console.log("Organizations data:", data); // 调试日志
				// 组织数据已经包含了 membersCount 字段
				const orgsWithMemberCount = (data.organizations || []).map(
					(org: any) => ({
						id: org.id,
						name: org.name,
						memberCount: org.membersCount || 0,
					}),
				);
				setOrganizations(orgsWithMemberCount);
			} else {
				console.error(
					"Failed to fetch organizations:",
					response.status,
					response.statusText,
				);
				const errorText = await response.text();
				console.error("Error response:", errorText);
			}
		} catch (error) {
			console.error("Failed to fetch organizations:", error);
		}
	};

	const handleSelectAllUsers = (checked: boolean) => {
		setSelectAllUsers(checked);
		if (checked) {
			setSelectedUsers(users.map((user) => user.id));
		} else {
			setSelectedUsers([]);
		}
	};

	const handleUserSelection = (userId: string, checked: boolean) => {
		if (checked) {
			setSelectedUsers((prev) => [...prev, userId]);
		} else {
			setSelectedUsers((prev) => prev.filter((id) => id !== userId));
			setSelectAllUsers(false);
		}
	};

	const handleOrganizationSelection = (orgId: string, checked: boolean) => {
		if (checked) {
			setSelectedOrganizations((prev) => [...prev, orgId]);
		} else {
			setSelectedOrganizations((prev) =>
				prev.filter((id) => id !== orgId),
			);
		}
	};

	const handleSendEmail = async () => {
		if (!templateType || !subject || !content) {
			alert("请填写所有必填字段");
			return;
		}

		if (selectedUsers.length === 0 && selectedOrganizations.length === 0) {
			alert("请选择至少一个用户或组织");
			return;
		}

		try {
			setSending(true);

			const campaignData = {
				title: subject,
				description: `简化邮件发送 - ${templateType}`,
				type: templateType.toUpperCase(),
				templateId: "simplifiedEmail",
				subject,
				content: {
					content,
					title: subject,
					senderName: "HackathonWeekly Team",
				},
				audienceConfig: {
					userIds: selectedUsers,
					organizationIds: selectedOrganizations,
				},
			};

			// 创建邮件活动
			const createResponse = await fetch("/api/admin/emails/campaigns", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(campaignData),
			});

			if (!createResponse.ok) {
				throw new Error("创建邮件活动失败");
			}

			const { campaign } = await createResponse.json();

			// 发送邮件
			const sendResponse = await fetch(
				`/api/admin/emails/campaigns/${campaign.id}/send`,
				{
					method: "POST",
				},
			);

			if (!sendResponse.ok) {
				throw new Error("发送邮件失败");
			}

			const { recipientCount } = await sendResponse.json();

			alert(`邮件发送成功！预计发送给 ${recipientCount} 个用户`);

			// 重置表单
			setTemplateType("");
			setSubject("");
			setContent("");
			setSelectedUsers([]);
			setSelectedOrganizations([]);
			setSelectAllUsers(false);
		} catch (error) {
			console.error("Failed to send email:", error);
			alert(
				`发送失败: ${error instanceof Error ? error.message : "未知错误"}`,
			);
		} finally {
			setSending(false);
		}
	};

	const handleTemplateSelect = (
		value: string,
		template?: EmailTemplateOption,
	) => {
		setTemplateType(value);
		if (template?.defaultSubject !== undefined) {
			setSubject(template.defaultSubject);
		}
		if (template?.defaultContent !== undefined) {
			setContent(template.defaultContent);
		}
	};

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">邮件发送</h1>
				<p className="text-muted-foreground mt-2">
					选择模板，填写内容，选择收件人并发送邮件
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<EmailComposerForm
					title="邮件内容"
					description="选择邮件模板并填写内容"
					icon={<Mail className="w-5 h-5" />}
					templates={emailTemplates}
					selectedTemplate={templateType}
					onTemplateSelect={handleTemplateSelect}
					subject={subject}
					onSubjectChange={setSubject}
					content={content}
					onContentChange={setContent}
				/>

				{/* 收件人选择 */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Users className="w-5 h-5 mr-2" />
							收件人选择
						</CardTitle>
						<CardDescription>
							选择要发送邮件的用户或组织
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* 用户选择 */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<Label>用户</Label>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="selectAll"
										checked={selectAllUsers}
										onCheckedChange={handleSelectAllUsers}
									/>
									<Label
										htmlFor="selectAll"
										className="text-sm"
									>
										全选
									</Label>
								</div>
							</div>
							<div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
								{loading ? (
									<p className="text-center text-muted-foreground">
										加载中...
									</p>
								) : users.length === 0 ? (
									<p className="text-center text-muted-foreground">
										暂无用户
									</p>
								) : (
									users.map((user) => (
										<div
											key={user.id}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`user-${user.id}`}
												checked={selectedUsers.includes(
													user.id,
												)}
												onCheckedChange={(checked) =>
													handleUserSelection(
														user.id,
														checked as boolean,
													)
												}
											/>
											<Label
												htmlFor={`user-${user.id}`}
												className="text-sm flex-1"
											>
												{user.name} ({user.email})
											</Label>
										</div>
									))
								)}
							</div>
							{selectedUsers.length > 0 && (
								<p className="text-sm text-muted-foreground">
									已选择 {selectedUsers.length} 个用户
								</p>
							)}
						</div>

						{/* 组织选择 */}
						<div>
							<Label className="mb-2 block">组织</Label>
							<div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
								{organizations.length === 0 ? (
									<p className="text-center text-muted-foreground">
										暂无组织
									</p>
								) : (
									organizations.map((org) => (
										<div
											key={org.id}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`org-${org.id}`}
												checked={selectedOrganizations.includes(
													org.id,
												)}
												onCheckedChange={(checked) =>
													handleOrganizationSelection(
														org.id,
														checked as boolean,
													)
												}
											/>
											<Label
												htmlFor={`org-${org.id}`}
												className="text-sm flex-1"
											>
												<Building2 className="w-4 h-4 inline mr-1" />
												{org.name} ({org.memberCount}{" "}
												成员)
											</Label>
										</div>
									))
								)}
							</div>
							{selectedOrganizations.length > 0 && (
								<p className="text-sm text-muted-foreground">
									已选择 {selectedOrganizations.length} 个组织
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* 发送按钮 */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex justify-between items-center">
						<div>
							<p className="text-sm text-muted-foreground">
								将发送到：{selectedUsers.length} 个用户，
								{selectedOrganizations.length} 个组织
							</p>
						</div>
						<Button
							onClick={handleSendEmail}
							disabled={
								sending || !templateType || !subject || !content
							}
							size="lg"
						>
							{sending ? (
								<>
									<div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
									发送中...
								</>
							) : (
								<>
									<Send className="w-4 h-4 mr-2" />
									发送邮件
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
