import assert from "node:assert/strict";
import test from "node:test";
import {
	deleteEventRegistration,
	updateEventRegistration,
} from "../../database/prisma/queries/events";

interface RegistrationState {
	status: "PENDING" | "APPROVED" | "WAITLISTED" | "REJECTED" | "CANCELLED";
}

interface TicketState {
	currentQuantity: number;
	maxQuantity: number | null;
}

function createMockDbClient(params: {
	registrationState: RegistrationState;
	ticketState: TicketState;
	forceRegistrationStatusSnapshot?: RegistrationState["status"];
}) {
	const { registrationState, ticketState, forceRegistrationStatusSnapshot } =
		params;

	const tx = {
		eventRegistration: {
			findUnique: async () => ({
				id: "registration-1",
				status:
					forceRegistrationStatusSnapshot ?? registrationState.status,
				ticketTypeId: "ticket-1",
				ticketType: {
					name: "General",
					currentQuantity: ticketState.currentQuantity,
					maxQuantity: ticketState.maxQuantity,
				},
			}),
			update: async ({ data }: { data: { status?: string } }) => {
				if (data.status) {
					registrationState.status =
						data.status as RegistrationState["status"];
				}
				return {
					id: "registration-1",
					userId: "user-1",
					status: registrationState.status,
					user: {
						id: "user-1",
						name: "User",
						email: "user@example.com",
						image: null,
						username: "user",
						phoneNumber: null,
					},
					event: {
						id: "event-1",
						title: "Event",
						startTime: new Date("2026-01-01T00:00:00.000Z"),
						endTime: new Date("2026-01-02T00:00:00.000Z"),
					},
				};
			},
		},
		eventTicketType: {
			updateMany: async ({
				where,
				data,
			}: {
				where: {
					currentQuantity?: { gt?: number };
					maxQuantity?: number | null;
				} & Record<string, unknown>;
				data: {
					currentQuantity?: {
						increment?: number;
						decrement?: number;
					};
				};
			}) => {
				const increment = data.currentQuantity?.increment ?? 0;
				const decrement = data.currentQuantity?.decrement ?? 0;

				if (increment > 0) {
					if (
						where.maxQuantity !== undefined &&
						where.maxQuantity !== ticketState.maxQuantity
					) {
						return { count: 0 };
					}
					if (
						where.currentQuantity !== undefined &&
						where.currentQuantity !== ticketState.currentQuantity
					) {
						return { count: 0 };
					}
					ticketState.currentQuantity += increment;
					return { count: 1 };
				}

				if (decrement > 0) {
					if (
						where.currentQuantity?.gt !== undefined &&
						ticketState.currentQuantity <= where.currentQuantity.gt
					) {
						return { count: 0 };
					}
					ticketState.currentQuantity -= decrement;
					return { count: 1 };
				}

				return { count: 0 };
			},
			findUnique: async () => ({
				currentQuantity: ticketState.currentQuantity,
				maxQuantity: ticketState.maxQuantity,
				isActive: true,
			}),
		},
	};

	return {
		eventRegistration: {
			findUnique: async () => ({
				id: "registration-1",
				ticketTypeId: "ticket-1",
				orderId: null,
				status: registrationState.status,
			}),
		},
		$transaction: async (fn: (innerTx: typeof tx) => Promise<unknown>) =>
			await fn(tx),
	};
}

test("deleteEventRegistration does not decrement inventory twice", async () => {
	const registrationState: RegistrationState = { status: "PENDING" };
	const ticketState: TicketState = { currentQuantity: 1, maxQuantity: 10 };
	const client = createMockDbClient({ registrationState, ticketState });

	await deleteEventRegistration("event-1", "user-1", client as any);
	assert.equal(registrationState.status, "CANCELLED");
	assert.equal(ticketState.currentQuantity, 0);

	await assert.rejects(
		deleteEventRegistration("event-1", "user-1", client as any),
		/already cancelled/i,
	);
	assert.equal(ticketState.currentQuantity, 0);
});

test("updateEventRegistration releases inventory when moving from occupying to non-occupying status", async () => {
	const registrationState: RegistrationState = { status: "PENDING" };
	const ticketState: TicketState = { currentQuantity: 1, maxQuantity: 10 };
	const client = createMockDbClient({ registrationState, ticketState });

	await updateEventRegistration(
		"event-1",
		"user-1",
		{ status: "REJECTED", reviewedBy: "admin-1" },
		client as any,
	);

	assert.equal(ticketState.currentQuantity, 0);
	assert.equal(registrationState.status, "REJECTED");
});

test("updateEventRegistration blocks non-occupying to occupying transition when stock is full", async () => {
	const registrationState: RegistrationState = { status: "CANCELLED" };
	const ticketState: TicketState = { currentQuantity: 1, maxQuantity: 1 };
	const client = createMockDbClient({ registrationState, ticketState });

	await assert.rejects(
		updateEventRegistration(
			"event-1",
			"user-1",
			{ status: "APPROVED", reviewedBy: "admin-1" },
			client as any,
		),
		/sold out/i,
	);

	assert.equal(ticketState.currentQuantity, 1);
	assert.equal(registrationState.status, "CANCELLED");
});

test("updateEventRegistration reserves inventory when stock is available", async () => {
	const registrationState: RegistrationState = { status: "CANCELLED" };
	const ticketState: TicketState = { currentQuantity: 0, maxQuantity: 1 };
	const client = createMockDbClient({ registrationState, ticketState });

	await updateEventRegistration(
		"event-1",
		"user-1",
		{ status: "APPROVED", reviewedBy: "admin-1" },
		client as any,
	);

	assert.equal(ticketState.currentQuantity, 1);
	assert.equal(registrationState.status, "APPROVED");
});

test("concurrent occupying transitions only allow one successful reservation", async () => {
	const registrationState: RegistrationState = { status: "CANCELLED" };
	const ticketState: TicketState = { currentQuantity: 0, maxQuantity: 1 };
	const client = createMockDbClient({
		registrationState,
		ticketState,
		forceRegistrationStatusSnapshot: "CANCELLED",
	});

	const [first, second] = await Promise.allSettled([
		updateEventRegistration(
			"event-1",
			"user-1",
			{ status: "APPROVED", reviewedBy: "admin-1" },
			client as any,
		),
		updateEventRegistration(
			"event-1",
			"user-1",
			{ status: "APPROVED", reviewedBy: "admin-1" },
			client as any,
		),
	]);

	const fulfilledCount =
		(first.status === "fulfilled" ? 1 : 0) +
		(second.status === "fulfilled" ? 1 : 0);
	const rejectedCount =
		(first.status === "rejected" ? 1 : 0) +
		(second.status === "rejected" ? 1 : 0);

	assert.equal(fulfilledCount, 1);
	assert.equal(rejectedCount, 1);
	assert.equal(ticketState.currentQuantity, 1);
});
