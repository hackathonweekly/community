"use client";

import { Button } from "@community/ui/ui/button";
import { Textarea } from "@community/ui/ui/textarea";
import type { AiChatSchema } from "@community/lib-server/database/prisma/zod";
import { cn } from "@community/lib-shared/utils";
import {
	aiChatListQueryKey,
	useAiChatListQuery,
	useAiChatQuery,
	useCreateAiChatMutation,
} from "@account/ai/lib/api";
import { SidebarContentLayout } from "@account/shared/components/SidebarContentLayout";
import { useQueryClient } from "@tanstack/react-query";
import { type UIMessage, useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { EllipsisIcon, PlusIcon, SendIcon } from "lucide-react";
import { useFormatter } from "next-intl";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { z } from "zod";

type AiChat = z.infer<typeof AiChatSchema>;

// Type for AI chat as returned from API (dates are strings)
type AiChatFromApi = {
	id: string;
	organizationId: string | null;
	userId: string | null;
	title: string | null;
	messages: any;
	createdAt: string;
	updatedAt: string;
};

function getMessageText(message: UIMessage): string {
	return message.parts
		.filter(
			(part): part is { type: "text"; text: string } =>
				part.type === "text",
		)
		.map((part) => part.text)
		.join("");
}

export function AiChat({ organizationId }: { organizationId?: string }) {
	const formatter = useFormatter();
	const queryClient = useQueryClient();
	const { data: chats, status: chatsStatus } =
		useAiChatListQuery(organizationId);
	const [chatId, setChatId] = useQueryState("chatId");
	const { data: currentChat } = useAiChatQuery(chatId ?? "new");
	const createChatMutation = useCreateAiChatMutation();
	const [input, setInput] = useState("");
	const { messages, sendMessage, status, setMessages } = useChat({
		transport: new TextStreamChatTransport({
			api: `/api/ai/chats/${chatId}/messages`,
			credentials: "include",
		}),
		messages: [],
	});

	const isLoading = status === "streaming" || status === "submitted";

	useEffect(() => {
		if (currentChat?.messages?.length) {
			setMessages(currentChat.messages as unknown as UIMessage[]);
		}
	}, [currentChat]);

	const createNewChat = useCallback(async () => {
		const newChat = await createChatMutation.mutateAsync({
			organizationId,
		});
		await queryClient.invalidateQueries({
			queryKey: aiChatListQueryKey(organizationId),
		});
		setChatId(newChat.id);
	}, [createChatMutation]);

	useEffect(() => {
		(async () => {
			if (chatId || chatsStatus !== "success") {
				return;
			}

			if (chats?.length) {
				setChatId(chats[0].id);
			} else {
				await createNewChat();
				setMessages([]);
			}
		})();
	}, [chatsStatus]);

	const hasChat =
		chatsStatus === "success" && !!chats?.length && !!currentChat?.id;

	const sortedChats = useMemo(() => {
		return (
			chats?.sort(
				(a: AiChatFromApi, b: AiChatFromApi) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
			) ?? []
		);
	}, [chats]);

	const handleSubmit = useCallback(
		(e?: { preventDefault?: () => void }) => {
			e?.preventDefault?.();
			if (!input.trim()) return;
			sendMessage({ text: input });
			setInput("");
		},
		[input, sendMessage],
	);

	return (
		<SidebarContentLayout
			sidebarOnTopMobile
			sidebarWidth={300}
			wrapSidebar={false}
			sidebarClassName="lg:pr-2"
			sidebar={
				<div>
					<Button
						variant="outline"
						size="sm"
						className="mb-4 flex w-full items-center gap-2"
						disabled={createChatMutation.isPending}
						onClick={createNewChat}
					>
						<PlusIcon className="size-4" />
						New chat
					</Button>

					{sortedChats.map((chat: AiChatFromApi) => (
						<div className="relative" key={chat.id}>
							<Button
								variant="link"
								onClick={() => setChatId(chat.id)}
								className={cn(
									"block h-auto w-full py-2 text-left text-foreground hover:no-underline",
									chat.id === chatId &&
										"bg-primary/10 font-bold text-primary",
								)}
							>
								<span className="w-full overflow-hidden">
									<span className="block truncate">
										{chat.title ??
											(chat.messages?.at(0) as any)
												?.content ??
											"Untitled chat"}
									</span>
									<small className="block font-normal">
										{formatter.dateTime(
											new Date(chat.createdAt),
											{
												dateStyle: "short",
												timeStyle: "short",
											},
										)}
									</small>
								</span>
							</Button>
						</div>
					))}
				</div>
			}
		>
			<div className="-mt-8 flex h-[calc(100vh-10rem)] flex-col">
				<div className="flex flex-1 flex-col gap-2 overflow-y-auto py-8">
					{messages.map((message, index) => (
						<div
							key={index}
							className={cn(
								"flex flex-col gap-2",
								message.role === "user"
									? "items-end"
									: "items-start",
							)}
						>
							<div
								className={cn(
									"flex max-w-2xl items-center gap-2 whitespace-pre-wrap rounded-lg px-4 py-2 text-foreground",
									message.role === "user"
										? "bg-primary/10"
										: "bg-secondary/10",
								)}
							>
								{getMessageText(message)}
							</div>
						</div>
					))}

					{isLoading && (
						<div className="flex justify-start">
							<div className="flex max-w-2xl items-center gap-2 rounded-lg bg-secondary/10 px-4 py-2 text-foreground">
								<EllipsisIcon className="size-6 animate-pulse" />
							</div>
						</div>
					)}
				</div>

				<form
					onSubmit={handleSubmit}
					className="relative shrink-0 rounded-lg border-none bg-card py-6 pr-14 pl-6 text-lg shadow-sm focus:outline-hidden focus-visible:ring-0"
				>
					<Textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						disabled={!hasChat}
						placeholder="Chat with your AI..."
						className="min-h-8 rounded-none border-none bg-transparent p-0 focus:outline-hidden focus-visible:ring-0 shadow-none"
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e);
							}
						}}
					/>

					<Button
						type="submit"
						size="icon"
						variant="secondary"
						className="absolute right-3 bottom-3"
						disabled={!hasChat}
					>
						<SendIcon className="size-4" />
					</Button>
				</form>
			</div>
		</SidebarContentLayout>
	);
}
