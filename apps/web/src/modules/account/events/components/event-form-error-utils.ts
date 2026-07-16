import type { FieldErrors } from "react-hook-form";
import type { EventFormData } from "./types";

const TOP_LEVEL_FIELD_LABELS: Partial<Record<keyof EventFormData, string>> = {
	title: "活动标题",
	richContent: "活动详情",
	startTime: "开始时间",
	endTime: "结束时间",
	location: "活动地点",
	externalUrl: "外部报名链接",
};

const TICKET_FIELD_LABELS: Record<string, string> = {
	name: "票种名称",
	price: "价格",
	quantity: "票数量",
	description: "描述",
};

const readMessage = (value: unknown) => {
	if (!value || typeof value !== "object") {
		return null;
	}

	const message = (value as { message?: unknown }).message;
	return typeof message === "string" && message.trim() ? message : null;
};

export function getTicketTypeValidationMessages(
	ticketErrors: unknown,
): string[] {
	if (!ticketErrors || typeof ticketErrors !== "object") {
		return [];
	}

	return Object.entries(ticketErrors as Record<string, unknown>).flatMap(
		([ticketIndex, value]) => {
			if (
				!/^\d+$/.test(ticketIndex) ||
				!value ||
				typeof value !== "object"
			) {
				return [];
			}

			return Object.entries(value as Record<string, unknown>).flatMap(
				([fieldName, fieldError]) => {
					const message = readMessage(fieldError);
					if (!message) {
						return [];
					}
					return [
						`票种 ${Number(ticketIndex) + 1} · ${TICKET_FIELD_LABELS[fieldName] || fieldName}：${message}`,
					];
				},
			);
		},
	);
}

export function getEventFormValidationMessages(
	errors: FieldErrors<EventFormData>,
): string[] {
	const messages = Object.entries(TOP_LEVEL_FIELD_LABELS).flatMap(
		([fieldName, label]) => {
			const message = readMessage(
				errors[fieldName as keyof FieldErrors<EventFormData>],
			);
			return message ? [`${label}：${message}`] : [];
		},
	);

	return [
		...messages,
		...getTicketTypeValidationMessages(errors.ticketTypes),
	];
}
