import { beforeEach, describe, expect, mock, test } from "bun:test";

type MockFn = (...args: any[]) => any;

const mockDb: {
	$transaction: MockFn;
	eventOrder: Record<string, MockFn>;
	eventRegistration: Record<string, MockFn>;
	eventOrderInvite: Record<string, MockFn>;
	eventTicketType: Record<string, MockFn>;
	eventAnswer: Record<string, MockFn>;
} = {
	$transaction: async () => null,
	eventOrder: {},
	eventRegistration: {},
	eventOrderInvite: {},
	eventTicketType: {},
	eventAnswer: {},
};

mock.module("@community/lib-server/database/prisma/client", () => ({
	db: mockDb,
}));

const loadEventOrders = async () => import("../event-orders");

beforeEach(() => {
	mockDb.eventOrder = {};
	mockDb.eventRegistration = {};
	mockDb.eventOrderInvite = {};
	mockDb.eventTicketType = {};
	mockDb.eventAnswer = {};
});

describe("event order lifecycle", () => {
	test("cancelEventOrder releases inventory and marks records", async () => {
		const updates: Record<string, any> = {};
		const order = {
			id: "order-1",
			status: "PENDING",
			quantity: 2,
			ticketTypeId: "ticket-1",
		};

		mockDb.$transaction = async (fn: MockFn) => fn(mockDb);
		mockDb.eventOrder.findUnique = async () => order;
		mockDb.eventOrder.update = async (args: any) => {
			updates.order = args;
			return { ...order, status: "CANCELLED" };
		};
		mockDb.eventRegistration.updateMany = async (args: any) => {
			updates.registration = args;
		};
		mockDb.eventOrderInvite.updateMany = async (args: any) => {
			updates.invites = args;
		};
		mockDb.eventTicketType.update = async (args: any) => {
			updates.ticket = args;
		};

		const { cancelEventOrder } = await loadEventOrders();
		await cancelEventOrder(order.id);

		expect(updates.order?.data?.status).toBe("CANCELLED");
		expect(updates.registration?.data?.status).toBe("CANCELLED");
		expect(updates.ticket?.data?.currentQuantity?.decrement).toBe(2);
	});

	test("markEventOrderPaid updates registration status", async () => {
		const updates: Record<string, any> = {};
		const order = {
			id: "order-2",
			status: "PENDING",
			event: { requireApproval: false },
		};

		mockDb.$transaction = async (fn: MockFn) => fn(mockDb);
		mockDb.eventOrder.findUnique = async () => order;
		mockDb.eventOrder.update = async (args: any) => {
			updates.order = args;
			return { ...order, status: "PAID" };
		};
		mockDb.eventRegistration.updateMany = async (args: any) => {
			updates.registration = args;
		};

		const { markEventOrderPaid } = await loadEventOrders();
		const result = await markEventOrderPaid({
			orderNo: "order-no",
			transactionId: "wechat-1",
		});

		expect(result?.registrationStatus).toBe("APPROVED");
		expect(updates.registration?.data?.status).toBe("APPROVED");
	});

	test("markEventOrderPaid is idempotent for non-pending orders", async () => {
		let updateCalled = false;
		const order = {
			id: "order-3",
			status: "PAID",
			event: { requireApproval: true },
		};

		mockDb.$transaction = async (fn: MockFn) => fn(mockDb);
		mockDb.eventOrder.findUnique = async () => order;
		mockDb.eventOrder.update = async () => {
			updateCalled = true;
		};

		const { markEventOrderPaid } = await loadEventOrders();
		const result = await markEventOrderPaid({
			orderNo: "order-no",
			transactionId: "wechat-2",
		});

		expect(result).toBe(order);
		expect(updateCalled).toBe(false);
	});

	test("markEventOrderRefunded releases inventory", async () => {
		const updates: Record<string, any> = {};
		const order = {
			id: "order-4",
			status: "PAID",
			quantity: 3,
			ticketTypeId: "ticket-2",
		};

		mockDb.$transaction = async (fn: MockFn) => fn(mockDb);
		mockDb.eventOrder.findUnique = async () => order;
		mockDb.eventOrder.update = async (args: any) => {
			updates.order = args;
			return { ...order, status: "REFUNDED" };
		};
		mockDb.eventRegistration.updateMany = async (args: any) => {
			updates.registration = args;
		};
		mockDb.eventOrderInvite.updateMany = async (args: any) => {
			updates.invites = args;
		};
		mockDb.eventTicketType.update = async (args: any) => {
			updates.ticket = args;
		};

		const { markEventOrderRefunded } = await loadEventOrders();
		await markEventOrderRefunded({
			orderNo: "order-no",
			refundId: "refund-1",
		});

		expect(updates.order?.data?.status).toBe("REFUNDED");
		expect(updates.ticket?.data?.currentQuantity?.decrement).toBe(3);
	});

	test("redeemOrderInvite creates registration and marks invite", async () => {
		const updates: Record<string, any> = {};
		const invite = {
			id: "invite-1",
			status: "PENDING",
			orderId: "order-5",
			order: {
				ticketTypeId: "ticket-3",
				status: "PAID",
				event: { id: "event-1", requireApproval: false },
			},
		};
		const registration = {
			id: "registration-1",
			userId: "user-1",
			status: "APPROVED",
		};

		mockDb.$transaction = async (fn: MockFn) => fn(mockDb);
		mockDb.eventOrderInvite.findFirst = async () => invite;
		mockDb.eventRegistration.findUnique = async () => null;
		mockDb.eventRegistration.create = async () => registration;
		mockDb.eventOrderInvite.update = async (args: any) => {
			updates.invite = args;
		};
		mockDb.eventAnswer.createMany = async () => null;

		const { redeemOrderInvite } = await loadEventOrders();
		const result = await redeemOrderInvite({
			eventId: "event-1",
			code: "invite-code",
			userId: "user-1",
		});

		expect(result).toBe(registration);
		expect(updates.invite?.data?.status).toBe("REDEEMED");
		expect(updates.invite?.data?.redeemedBy).toBe("user-1");
	});
});
