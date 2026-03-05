import {
	Megaphone,
	GraduationCap,
	Users,
	Sparkles,
	MessageCircle,
} from "lucide-react";

export const POST_CHANNELS = {
	SHOWCASE: {
		label: "作品展示",
		labelEn: "Showcase",
		icon: Sparkles,
		color: "text-amber-500",
	},
	LEARNING: {
		label: "学习笔记",
		labelEn: "Learning",
		icon: GraduationCap,
		color: "text-blue-500",
	},
	TEAM_UP: {
		label: "组队招人",
		labelEn: "Team Up",
		icon: Users,
		color: "text-green-500",
	},
	ANNOUNCEMENT: {
		label: "公告",
		labelEn: "Announcement",
		icon: Megaphone,
		color: "text-red-500",
	},
	CHAT: {
		label: "闲聊",
		labelEn: "Chat",
		icon: MessageCircle,
		color: "text-purple-500",
	},
} as const;

export type PostChannelKey = keyof typeof POST_CHANNELS;
