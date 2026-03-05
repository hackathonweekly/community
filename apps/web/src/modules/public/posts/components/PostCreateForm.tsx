"use client";

import { useState } from "react";
import { Button } from "@community/ui/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@community/ui/ui/dialog";
import { Input } from "@community/ui/ui/input";
import { Textarea } from "@community/ui/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@community/ui/ui/select";
import type { PostChannel } from "@prisma/client";
import { useCreatePost } from "../hooks/use-posts";
import { POST_CHANNELS, type PostChannelKey } from "../lib/post-channels";

interface PostCreateFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PostCreateForm({ open, onOpenChange }: PostCreateFormProps) {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [channel, setChannel] = useState<PostChannel>("CHAT");
	const createPost = useCreatePost();

	const handleSubmit = async () => {
		if (!content.trim()) return;

		await createPost.mutateAsync({
			title: title.trim() || undefined,
			content: content.trim(),
			channel,
		});

		setTitle("");
		setContent("");
		setChannel("CHAT");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>发布帖子</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Select
						value={channel}
						onValueChange={(v) => setChannel(v as PostChannel)}
					>
						<SelectTrigger>
							<SelectValue placeholder="选择频道" />
						</SelectTrigger>
						<SelectContent>
							{(
								Object.keys(POST_CHANNELS) as PostChannelKey[]
							).map((key) => {
								const ch = POST_CHANNELS[key];
								const Icon = ch.icon;
								return (
									<SelectItem key={key} value={key}>
										<span className="flex items-center gap-2">
											<Icon
												className={`h-4 w-4 ${ch.color}`}
											/>
											{ch.label}
										</span>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>

					<Input
						placeholder="标题（可选）"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={200}
					/>

					<Textarea
						placeholder="分享你的想法..."
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows={6}
						maxLength={10000}
					/>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							取消
						</Button>
						<Button
							onClick={handleSubmit}
							disabled={!content.trim() || createPost.isPending}
						>
							{createPost.isPending ? "发布中..." : "发布"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
