import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	parseCommunicationContent,
	serializeCommunicationContent,
} from "../event-communication-content";

describe("event communication content helper", () => {
	it("serializes and parses optional image url", () => {
		const stored = serializeCommunicationContent({
			content: "活动明天开始，请准时参加。",
			imageUrl: "https://cdn.example.com/reminder.png",
		});

		const parsed = parseCommunicationContent(stored);
		assert.equal(parsed.content, "活动明天开始，请准时参加。");
		assert.equal(parsed.imageUrl, "https://cdn.example.com/reminder.png");
	});

	it("returns plain content when no image metadata exists", () => {
		const parsed = parseCommunicationContent("仅文本提醒");

		assert.equal(parsed.content, "仅文本提醒");
		assert.equal(parsed.imageUrl, undefined);
	});

	it("drops invalid image metadata", () => {
		const stored = "消息内容\n\n[HW_IMAGE_URL:javascript:alert(1)]";
		const parsed = parseCommunicationContent(stored);

		assert.equal(parsed.content, "消息内容");
		assert.equal(parsed.imageUrl, undefined);
	});
});
