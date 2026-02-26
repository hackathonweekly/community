"use client";

import { Alert, AlertDescription } from "@community/ui/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@community/ui/ui/avatar";
import { Button } from "@community/ui/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@community/ui/ui/card";
import { Input } from "@community/ui/ui/input";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import {
	ArrowLeft,
	CheckCircle,
	Copy,
	Info,
	Link2,
	Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
	const [membershipStatus, setMembershipStatus] = useState<
		"loading" | "member" | "non-member"
	>("loading");

	const router = useRouter();
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
				setOrganization(null);
				setMembershipStatus("non-member");
			}
		} catch (error) {
			console.error("Failed to fetch organization:", error);
		} finally {
			setLoading(false);
		}
	};

	const checkMembershipStatus = async () => {
		if (!currentUser) {
			const redirectTo = `/orgs/${slug}/invite-member`;
			router.push(
				`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`,
			);
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

	const handleGenerateLink = async () => {
		if (!organization || !currentUser) {
			return;
		}
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
					}),
				},
			);

			if (response.ok) {
				const data = await response.json();
				setInvitationUrl(data.invitationUrl || "");
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
		const orgDetailsHref = `/orgs/${organization.slug}`;

		return (
			<div className="container max-w-4xl pt-16 pb-16">
				<div className="mb-6">
					<Button variant="ghost" className="gap-2" asChild>
						<Link href={orgDetailsHref}>
							<ArrowLeft className="h-4 w-4" />
							返回组织页面
						</Link>
					</Button>
				</div>

				<div className="text-center py-12 space-y-6">
					<CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
					<div className="space-y-3">
						<h1 className="font-bold text-3xl">邀请链接已生成</h1>
						<p className="text-lg text-muted-foreground">
							请将链接分享给对方填写申请
						</p>
					</div>

					<Card className="max-w-2xl mx-auto text-left">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Link2 className="h-5 w-5" />
								邀请链接
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
							<Alert>
								<Info className="h-4 w-4" />
								<AlertDescription className="text-sm space-y-2">
									<p>
										链接将打开申请表，邀请人信息会自动带入，无需对方重复填写。
									</p>
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// 邀请问卷表单
	const orgDetailsHref = `/orgs/${organization.slug}`;
	return (
		<div className="container max-w-4xl pt-16 pb-16">
			<div className="mb-6">
				<Button variant="ghost" className="gap-2" asChild>
					<Link href={orgDetailsHref}>
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
								"生成邀请链接，分享给对方填写申请"}
						</p>
					</div>
				</div>
			</div>

			<Alert className="mb-6">
				<Info className="h-4 w-4" />
				<AlertDescription className="space-y-2 text-sm">
					<p>生成的链接会打开申请表，邀请人信息自动带入。</p>
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5" />
						生成邀请链接
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<p className="text-sm text-muted-foreground">
							点击按钮生成链接，分享给对方填写申请。
						</p>
						<div className="flex justify-end">
							<Button
								type="button"
								size="lg"
								disabled={isSubmitting}
								className="w-full sm:w-auto"
								onClick={handleGenerateLink}
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
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
