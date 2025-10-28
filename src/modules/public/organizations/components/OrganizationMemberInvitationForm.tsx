"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import {
	ArrowLeft,
	CheckCircle,
	Copy,
	Heart,
	Info,
	Link2,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface OrganizationData {
	id: string;
	name: string;
	slug: string;
	summary: string | null;
	logo: string | null;
}

interface OrganizationMemberInvitationFormProps {
	slug: string;
}

const MIN_TEXT_LENGTH = 10; // 最小文本长度
const MAX_TEXT_LENGTH = 500; // 最大文本长度

export function OrganizationMemberInvitationForm({
	slug,
}: OrganizationMemberInvitationFormProps) {
	const [organization, setOrganization] = useState<OrganizationData | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const [invitationUrl, setInvitationUrl] = useState("");
	const [invitationMode, setInvitationMode] = useState<
		"direct" | "referral" | null
	>(null);
	const [invitationCode, setInvitationCode] = useState<string | null>(null);
	const [invitationPath, setInvitationPath] = useState<string | null>(null);
	const [membershipStatus, setMembershipStatus] = useState<
		"loading" | "member" | "non-member"
	>("loading");

	const [formData, setFormData] = useState({
		inviteeName: "",
		invitationReason: "",
		eligibilityDetails: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const router = useRouter();
	const t = useTranslations("organizations");
	const authStatus = useAuthStatus();
	const currentUser = authStatus.user;

	useEffect(() => {
		fetchOrganization();
		checkMembershipStatus();
	}, [slug, currentUser]);

	const fetchOrganization = async () => {
		try {
			const response = await fetch(`/api/organizations/by-slug/${slug}`);
			if (response.ok) {
				const data = await response.json();
				setOrganization(data);
			} else if (response.status === 404) {
				notFound();
			}
		} catch (error) {
			console.error("Failed to fetch organization:", error);
		} finally {
			setLoading(false);
		}
	};

	const checkMembershipStatus = async () => {
		if (!currentUser) {
			router.push(`/auth/login?redirectTo=/orgs/${slug}/invite-member`);
			return;
		}

		try {
			const response = await fetch(`/api/organizations/by-slug/${slug}`);
			if (response.ok) {
				const data = await response.json();
				const isMember = data.members?.some(
					(m: any) => m.user.id === currentUser.id,
				);
				setMembershipStatus(isMember ? "member" : "non-member");

				// 非成员不允许访问此页面
				if (!isMember) {
					router.push(`/orgs/${slug}`);
				}
			}
		} catch (error) {
			console.error("Failed to check membership:", error);
			setMembershipStatus("non-member");
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// 清除该字段的错误提示
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		// 被邀请人姓名验证
		if (!formData.inviteeName.trim()) {
			newErrors.inviteeName = "请填写被邀请人姓名";
		} else if (formData.inviteeName.trim().length < 2) {
			newErrors.inviteeName = "姓名至少需要2个字符";
		}

		// 邀请理由验证
		if (!formData.invitationReason.trim()) {
			newErrors.invitationReason = "请填写邀请理由";
		} else if (formData.invitationReason.trim().length < MIN_TEXT_LENGTH) {
			newErrors.invitationReason = `邀请理由至少需要${MIN_TEXT_LENGTH}个字符`;
		} else if (formData.invitationReason.length > MAX_TEXT_LENGTH) {
			newErrors.invitationReason = `邀请理由不能超过${MAX_TEXT_LENGTH}个字符`;
		}

		// 加入条件说明验证
		if (!formData.eligibilityDetails.trim()) {
			newErrors.eligibilityDetails = "请说明被邀请人如何符合加入条件";
		} else if (
			formData.eligibilityDetails.trim().length < MIN_TEXT_LENGTH
		) {
			newErrors.eligibilityDetails = `请至少填写${MIN_TEXT_LENGTH}个字符`;
		} else if (formData.eligibilityDetails.length > MAX_TEXT_LENGTH) {
			newErrors.eligibilityDetails = `内容不能超过${MAX_TEXT_LENGTH}个字符`;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!organization || !currentUser) {
			return;
		}

		if (!validateForm()) {
			return;
		}

		setInvitationMode(null);
		setInvitationCode(null);
		setInvitationPath(null);
		setIsSubmitting(true);
		try {
			const response = await fetch(
				"/api/organizations/member-invitations",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						organizationId: organization.id,
						inviterQuestionnaire: {
							inviteeName: formData.inviteeName.trim(),
							invitationReason: formData.invitationReason.trim(),
							eligibilityDetails:
								formData.eligibilityDetails.trim(),
						},
					}),
				},
			);

			if (response.ok) {
				const data = await response.json();
				setInvitationMode(
					data.mode === "referral" ? "referral" : "direct",
				);
				setInvitationCode(data.invitationCode ?? null);
				setInvitationPath(data.invitationPath ?? null);
				setInvitationUrl(data.invitationUrl);
				setSubmitted(true);
			} else {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to create invitation",
				);
			}
		} catch (error) {
			console.error("Failed to submit invitation:", error);
			alert(error instanceof Error ? error.message : "提交邀请失败");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(invitationUrl);
			toast.success("邀请链接已复制到剪贴板");
		} catch (error) {
			toast.error("复制失败，请手动复制链接");
		}
	};

	if (loading || membershipStatus === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	if (!organization || membershipStatus === "non-member") {
		return null;
	}

	// 成功提交后的界面
	if (submitted) {
		const isReferral = invitationMode === "referral";
		const inviteeDisplayName = formData.inviteeName || "候选人";

		return (
			<div className="container max-w-4xl pt-16 pb-16">
				<div className="mb-6">
					<Button variant="ghost" className="gap-2" asChild>
						<Link href={`/orgs/${organization.slug}`}>
							<ArrowLeft className="h-4 w-4" />
							返回组织页面
						</Link>
					</Button>
				</div>

				<div className="text-center py-12 space-y-6">
					<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
					<div className="space-y-3">
						<h1 className="font-bold text-3xl">
							{isReferral ? "申请链接已生成" : "邀请链接已生成"}
						</h1>
						<p className="text-lg text-muted-foreground">
							请将链接分享给 <strong>{inviteeDisplayName}</strong>{" "}
							{isReferral
								? "，TA 可以通过该链接填写加入申请。"
								: "，TA 登录后即可加入组织。"}
						</p>
					</div>

					<Card className="max-w-2xl mx-auto text-left">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Link2 className="h-5 w-5" />
								{isReferral ? "申请链接" : "邀请链接"}
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-col gap-2 sm:flex-row">
								<Input
									readOnly
									value={invitationUrl}
									className="font-mono text-xs"
								/>
								<Button
									type="button"
									variant="outline"
									onClick={handleCopyLink}
								>
									<Copy className="mr-2 h-4 w-4" /> 复制链接
								</Button>
							</div>
							{isReferral && invitationCode ? (
								<div className="rounded-md border bg-muted/40 p-3 text-sm">
									<span className="text-muted-foreground">
										邀请码：
									</span>
									<span className="font-mono font-medium">
										{invitationCode}
									</span>
								</div>
							) : null}
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription className="text-sm space-y-2">
									{isReferral ? (
										<>
											<p>
												候选人提交申请后，组织管理员会看到您填写的推荐信息并进行审批。
											</p>
											<p>
												请提醒候选人在申请备注中补充必要信息，以便管理员快速通过审核。
											</p>
										</>
									) : (
										<p>
											该链接可直接将候选人加入组织，请仅分享给信任的伙伴。链接默认7天后过期，可在成员管理中重发。
										</p>
									)}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// 邀请问卷表单
	return (
		<div className="container max-w-4xl pt-16 pb-16">
			<div className="mb-6">
				<Button variant="ghost" className="gap-2" asChild>
					<Link href={`/orgs/${organization.slug}`}>
						<ArrowLeft className="h-4 w-4" />
						返回组织页面
					</Link>
				</Button>
			</div>

			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Avatar className="h-16 w-16">
						<AvatarImage src={organization.logo || ""} />
						<AvatarFallback className="text-lg">
							{organization.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-bold text-3xl">
							邀请成员加入 {organization.name}
						</h1>
						<p className="text-muted-foreground mt-1">
							{organization.summary ||
								"回答以下三个问题，系统会为候选人生成专属链接"}
						</p>
					</div>
				</div>
			</div>

			<Alert className="mb-6">
				<Info className="h-4 w-4" />
				<AlertDescription className="space-y-2 text-sm">
					<p>
						<strong>邀请流程说明：</strong>
					</p>
					<ul className="list-disc list-inside space-y-1 pl-1">
						<li>管理员生成的链接可让候选人直接加入组织。</li>
						<li>
							普通成员生成的链接会引导候选人提交加入申请，需管理员审核。
						</li>
						<li>
							请尽量提供充分、具体的邀请理由，帮助管理员快速做出判断。
						</li>
					</ul>
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Heart className="h-5 w-5" />
						候选人评估问卷
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* 被邀请人姓名 */}
						<div>
							<Label htmlFor="inviteeName">
								被邀请人姓名{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="inviteeName"
								name="inviteeName"
								value={formData.inviteeName}
								onChange={handleInputChange}
								placeholder="请输入被邀请人的姓名"
								className={
									errors.inviteeName ? "border-red-500" : ""
								}
							/>
							{errors.inviteeName && (
								<p className="text-red-500 text-sm mt-1">
									{errors.inviteeName}
								</p>
							)}
						</div>

						{/* 邀请理由 */}
						<div>
							<Label htmlFor="invitationReason">
								邀请理由 <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="invitationReason"
								name="invitationReason"
								value={formData.invitationReason}
								onChange={handleInputChange}
								placeholder="请说明为什么邀请该候选人加入组织、期待Ta为组织带来什么（至少10字）"
								rows={4}
								className={
									errors.invitationReason
										? "border-red-500"
										: ""
								}
							/>
							<p className="text-xs text-muted-foreground mt-1">
								{formData.invitationReason.length} /{" "}
								{MAX_TEXT_LENGTH} 字符
							</p>
							{errors.invitationReason && (
								<p className="text-red-500 text-sm mt-1">
									{errors.invitationReason}
								</p>
							)}
						</div>

						{/* 符合加入条件说明 */}
						<div>
							<Label htmlFor="eligibilityDetails">
								符合加入条件的依据{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="eligibilityDetails"
								name="eligibilityDetails"
								value={formData.eligibilityDetails}
								onChange={handleInputChange}
								placeholder="请说明候选人如何符合组织的加入条件，例如曾经的志愿经历、完成的任务或具备的资格（至少10字）"
								rows={4}
								className={
									errors.eligibilityDetails
										? "border-red-500"
										: ""
								}
							/>
							<p className="text-xs text-muted-foreground mt-1">
								{formData.eligibilityDetails.length} /{" "}
								{MAX_TEXT_LENGTH} 字符
							</p>
							{errors.eligibilityDetails && (
								<p className="text-red-500 text-sm mt-1">
									{errors.eligibilityDetails}
								</p>
							)}
						</div>

						<div className="flex justify-end">
							<Button
								type="submit"
								size="lg"
								disabled={isSubmitting}
								className="w-full sm:w-auto"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										生成邀请链接...
									</>
								) : (
									<>
										<Link2 className="mr-2 h-4 w-4" />
										生成邀请链接
									</>
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
