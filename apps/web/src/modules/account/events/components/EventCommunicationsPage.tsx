"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@community/ui/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@community/ui/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@community/ui/ui/alert";
import { Button } from "@community/ui/ui/button";
import { Skeleton } from "@community/ui/ui/skeleton";
import { Badge } from "@community/ui/ui/badge";
import { SendCommunicationForm } from "./SendCommunicationForm";
import { CommunicationHistory } from "./CommunicationHistory";
import { CommunicationDetails } from "./CommunicationDetails";
import {
	MessageSquare,
	AlertCircle,
	ArrowLeft,
	Send,
	Clock,
	CheckCircle,
	XCircle,
} from "lucide-react";

interface Event {
	id: string;
	title: string;
	organizerId: string;
	_count: {
		registrations: number;
	};
}

interface CommunicationLimitInfo {
	canSend: boolean;
	remainingCount: number;
	totalUsed: number;
	maxAllowed: number;
}

interface CommunicationRecipient {
	userId: string;
	name: string;
	email: string | null;
	status: "APPROVED" | "PENDING";
	checkedIn: boolean;
	isSendableEmail: boolean;
}

type RecipientScope =
	| "ALL"
	| "APPROVED_ONLY"
	| "UNCHECKED_IN_ONLY"
	| "SELECTED";

interface CommunicationSendSummary {
	validRecipients: number;
	missingEmailCount: number;
	virtualEmailCount: number;
	unmatchedSelectedCount: number;
}

interface CommunicationRecord {
	id: string;
	type: "EMAIL" | "SMS";
	subject: string;
	content: string;
	imageUrl?: string;
	status: "PENDING" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
	totalRecipients: number;
	sentCount: number;
	deliveredCount: number;
	failedCount: number;
	createdAt: string;
	sentAt?: string;
	sender: {
		id: string;
		name: string;
		image?: string;
		username?: string;
	};
}

interface CommunicationDetailRecord {
	id: string;
	recipientId: string;
	recipientEmail?: string;
	recipientPhone?: string;
	status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "CANCELLED";
	sentAt?: string;
	deliveredAt?: string;
	readAt?: string;
	errorMessage?: string;
	retryCount: number;
	recipient: {
		id: string;
		name: string;
		image?: string;
		username?: string;
		email?: string;
		phoneNumber?: string;
	};
}

interface EventCommunicationsPageProps {
	embedded?: boolean;
}

export default function EventCommunicationsPage({
	embedded = false,
}: EventCommunicationsPageProps = {}) {
	const params = useParams();
	const router = useRouter();
	const eventId = params.eventId as string;

	// State
	const [event, setEvent] = useState<Event | null>(null);
	const [limitInfo, setLimitInfo] = useState<CommunicationLimitInfo | null>(
		null,
	);
	const [communications, setCommunications] = useState<CommunicationRecord[]>(
		[],
	);
	const [recipients, setRecipients] = useState<CommunicationRecipient[]>([]);
	const [sendSummary, setSendSummary] =
		useState<CommunicationSendSummary | null>(null);
	const [selectedCommunication, setSelectedCommunication] =
		useState<CommunicationRecord | null>(null);
	const [communicationRecords, setCommunicationRecords] = useState<
		CommunicationDetailRecord[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);

	// 加载初始数据
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				// 并行加载活动信息、通信限制和通信历史
				const [eventRes, limitRes, commRes, recipientRes] =
					await Promise.all([
						fetch(`/api/events/${eventId}`),
						fetch(`/api/event-communications/${eventId}/limit`),
						fetch(`/api/event-communications/${eventId}`),
						fetch(
							`/api/event-communications/${eventId}/recipients`,
						),
					]);

				if (!eventRes.ok) {
					if (eventRes.status === 404) {
						toast.error("活动不存在");
						router.push("/dashboard/events");
						return;
					}
					if (eventRes.status === 403) {
						toast.error("您没有权限管理该活动的通信功能");
						router.back();
						return;
					}
					throw new Error("加载活动信息失败");
				}

				const [eventData, limitData, commData, recipientData] =
					await Promise.all([
						eventRes.json(),
						limitRes.json(),
						commRes.json(),
						recipientRes.json(),
					]);

				setEvent(eventData.data);
				setLimitInfo(limitData.data);
				setCommunications(commData.data.communications || []);
				setRecipients(recipientData.data?.recipients || []);
			} catch (error) {
				console.error("加载数据失败:", error);
				toast.error("加载数据失败，请重试");
			} finally {
				setLoading(false);
			}
		};

		if (eventId) {
			loadData();
		}
	}, [eventId, router]);

	// 发送通信
	const handleSendCommunication = async (data: {
		type: "EMAIL";
		subject: string;
		content: string;
		imageUrl?: string;
		recipientScope: RecipientScope;
		selectedRecipientIds?: string[];
	}) => {
		try {
			setSending(true);

			const response = await fetch(
				`/api/event-communications/${eventId}/send`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "发送失败");
			}

			const stats = result.stats || {};
			const missingEmailCount =
				typeof stats.missingEmailCount === "number"
					? stats.missingEmailCount
					: 0;
			const virtualEmailCount =
				typeof stats.virtualEmailCount === "number"
					? stats.virtualEmailCount
					: 0;
			const unmatchedSelectedCount =
				typeof stats.unmatchedSelectedCount === "number"
					? stats.unmatchedSelectedCount
					: 0;
			const validRecipients =
				typeof stats.validRecipients === "number"
					? stats.validRecipients
					: 0;

			setSendSummary({
				validRecipients,
				missingEmailCount,
				virtualEmailCount,
				unmatchedSelectedCount,
			});

			toast.success(`提醒发送已启动，预计实际通知 ${validRecipients} 人`);

			const skippedByEmail = missingEmailCount + virtualEmailCount;
			if (skippedByEmail > 0) {
				toast.info(
					`有 ${skippedByEmail} 人因邮箱未填写或无效被跳过（未填写 ${missingEmailCount} 人，虚拟邮箱 ${virtualEmailCount} 人）`,
				);
			}
			if (unmatchedSelectedCount > 0) {
				toast.info(
					`有 ${unmatchedSelectedCount} 位手动选择参与者不在可发送名单中，已自动跳过`,
				);
			}
			if (result.warning) {
				toast.warning(result.warning);
			}

			// 刷新限制信息和通信历史
			const [limitRes, commRes, recipientRes] = await Promise.all([
				fetch(`/api/event-communications/${eventId}/limit`),
				fetch(`/api/event-communications/${eventId}`),
				fetch(`/api/event-communications/${eventId}/recipients`),
			]);

			if (limitRes.ok && commRes.ok && recipientRes.ok) {
				const [limitData, commData, recipientData] = await Promise.all([
					limitRes.json(),
					commRes.json(),
					recipientRes.json(),
				]);

				setLimitInfo(limitData.data);
				setCommunications(commData.data.communications || []);
				setRecipients(recipientData.data?.recipients || []);
			}
		} catch (error) {
			console.error("发送失败:", error);
			toast.error(error instanceof Error ? error.message : "发送失败");
		} finally {
			setSending(false);
		}
	};

	// 重试失败的通信
	const handleRetry = async (communicationId: string) => {
		try {
			const response = await fetch(
				`/api/event-communications/${eventId}/${communicationId}/retry`,
				{
					method: "POST",
				},
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "重试失败");
			}

			toast.success(result.message || "重试已开始");

			// 刷新通信历史
			const commRes = await fetch(`/api/event-communications/${eventId}`);
			if (commRes.ok) {
				const commData = await commRes.json();
				setCommunications(commData.data.communications || []);
			}
		} catch (error) {
			console.error("重试失败:", error);
			toast.error(error instanceof Error ? error.message : "重试失败");
		}
	};

	// 查看通信详情
	const handleViewDetails = (communication: CommunicationRecord) => {
		try {
			setSelectedCommunication(communication);

			fetch(
				`/api/event-communications/${eventId}/${communication.id}/records`,
			)
				.then((response) => response.json())
				.then((data) => {
					if (data.data) {
						setCommunicationRecords(data.data.records || []);
						setDetailsOpen(true);
					} else {
						throw new Error(data.error || "加载详情失败");
					}
				})
				.catch((error) => {
					console.error("加载详情失败:", error);
					toast.error(
						error instanceof Error ? error.message : "加载详情失败",
					);
				});
		} catch (error) {
			console.error("加载详情失败:", error);
			toast.error(
				error instanceof Error ? error.message : "加载详情失败",
			);
		}
	};

	// 渲染统计数据
	const renderStats = () => {
		if (!limitInfo) return null;

		const totalSent = communications.reduce(
			(sum, comm) => sum + comm.sentCount,
			0,
		);
		const totalDelivered = communications.reduce(
			(sum, comm) => sum + comm.deliveredCount,
			0,
		);
		const totalFailed = communications.reduce(
			(sum, comm) => sum + comm.failedCount,
			0,
		);

		return (
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Send className="h-5 w-5 text-blue-500" />
							<div>
								<div className="text-2xl font-bold text-blue-600">
									{limitInfo.totalUsed}
								</div>
								<div className="text-sm text-muted-foreground">
									已使用次数
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<Clock className="h-5 w-5 text-yellow-500" />
							<div>
								<div className="text-2xl font-bold text-yellow-600">
									{limitInfo.remainingCount}
								</div>
								<div className="text-sm text-muted-foreground">
									剩余次数
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<CheckCircle className="h-5 w-5 text-green-500" />
							<div>
								<div className="text-2xl font-bold text-green-600">
									{totalDelivered}
								</div>
								<div className="text-sm text-muted-foreground">
									成功送达
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2">
							<XCircle className="h-5 w-5 text-red-500" />
							<div>
								<div className="text-2xl font-bold text-red-600">
									{totalFailed}
								</div>
								<div className="text-sm text-muted-foreground">
									发送失败
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center space-x-3">
					<Skeleton className="h-6 w-6" />
					<Skeleton className="h-8 w-48" />
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<Skeleton className="h-16 w-full" />
							</CardContent>
						</Card>
					))}
				</div>

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!event || !limitInfo) {
		return (
			<div className="space-y-6">
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						加载活动信息失败，请刷新页面重试。
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{!embedded && (
				<div className="flex items-center space-x-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.back()}
						className="p-2"
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold flex items-center space-x-2">
							<MessageSquare className="h-6 w-6 text-blue-500" />
							<span>活动通信</span>
						</h1>
						<p className="text-muted-foreground mt-1">
							{event.title} · {event._count.registrations}{" "}
							名参与者
						</p>
					</div>
				</div>
			)}

			{sendSummary && (
				<Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
					<CheckCircle className="h-4 w-4 text-emerald-600" />
					<AlertTitle>最近一次发送摘要</AlertTitle>
					<AlertDescription>
						本次实际通知 {sendSummary.validRecipients}{" "}
						人。因邮箱未填写或无效跳过{" "}
						{sendSummary.missingEmailCount +
							sendSummary.virtualEmailCount}{" "}
						人（未填写 {sendSummary.missingEmailCount} 人，虚拟邮箱{" "}
						{sendSummary.virtualEmailCount} 人）。
						{sendSummary.unmatchedSelectedCount > 0
							? `另有 ${sendSummary.unmatchedSelectedCount} 位手动选择参与者不在可发送名单中。`
							: ""}
					</AlertDescription>
				</Alert>
			)}

			{/* 统计数据 */}
			{renderStats()}

			{/* 主要内容 */}
			<Tabs defaultValue="send" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger
						value="send"
						className="flex items-center space-x-2"
					>
						<Send className="h-4 w-4" />
						<span>发送通知</span>
					</TabsTrigger>
					<TabsTrigger
						value="history"
						className="flex items-center space-x-2"
					>
						<Clock className="h-4 w-4" />
						<span>通信历史</span>
						{communications.length > 0 && (
							<Badge variant="secondary" className="ml-1">
								{communications.length}
							</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value="send">
					<SendCommunicationForm
						eventTitle={event.title}
						participantCount={event._count.registrations}
						participants={recipients}
						limitInfo={limitInfo}
						onSend={handleSendCommunication}
						disabled={sending}
					/>
				</TabsContent>

				<TabsContent value="history">
					<CommunicationHistory
						eventId={eventId}
						communications={communications}
						canRetry={true}
						onRetry={handleRetry}
						onViewDetails={handleViewDetails}
					/>
				</TabsContent>
			</Tabs>

			{/* 通信详情对话框 */}
			{selectedCommunication && (
				<CommunicationDetails
					communication={selectedCommunication}
					records={communicationRecords}
					open={detailsOpen}
					onOpenChange={setDetailsOpen}
					onRetry={handleRetry}
				/>
			)}
		</div>
	);
}
