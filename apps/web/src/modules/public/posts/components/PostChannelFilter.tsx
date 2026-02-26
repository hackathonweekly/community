"use client";

import { Tabs, TabsList, TabsTrigger } from "@community/ui/ui/tabs";
import type { PostChannel } from "@prisma/client";
import { POST_CHANNELS, type PostChannelKey } from "../lib/post-channels";

interface PostChannelFilterProps {
	value?: PostChannel;
	onChange: (channel?: PostChannel) => void;
}

export function PostChannelFilter({ value, onChange }: PostChannelFilterProps) {
	return (
		<Tabs
			value={value || "ALL"}
			onValueChange={(v) =>
				onChange(v === "ALL" ? undefined : (v as PostChannel))
			}
		>
			<TabsList className="w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 no-scrollbar sm:flex-wrap">
				<TabsTrigger
					value="ALL"
					className="shrink-0 rounded-full border border-transparent px-3 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:border-input data-[state=inactive]:bg-background"
				>
					全部
				</TabsTrigger>
				{(Object.keys(POST_CHANNELS) as PostChannelKey[]).map((key) => {
					const ch = POST_CHANNELS[key];
					const Icon = ch.icon;
					return (
						<TabsTrigger
							key={key}
							value={key}
							className="shrink-0 rounded-full border border-transparent px-3 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:border-input data-[state=inactive]:bg-background"
						>
							<Icon className={`mr-1 h-3 w-3 ${ch.color}`} />
							{ch.label}
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
}
