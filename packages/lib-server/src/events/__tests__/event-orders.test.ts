import { resolveTicketPricing } from "../event-orders";

describe("resolveTicketPricing", () => {
	test("uses a matching tier for total amount", () => {
		const result = resolveTicketPricing({
			basePrice: 99,
			priceTiers: [{ quantity: 2, price: 169, currency: "CNY" }],
			quantity: 2,
		});

		expect(result.totalAmount).toBe(169);
		expect(result.unitPrice).toBeCloseTo(84.5);
		expect(result.currency).toBe("CNY");
	});

	test("falls back to base price for single quantity", () => {
		const result = resolveTicketPricing({
			basePrice: 99,
			priceTiers: [],
			quantity: 1,
		});

		expect(result.totalAmount).toBe(99);
		expect(result.unitPrice).toBe(99);
		expect(result.currency).toBe("CNY");
	});

	test("defaults currency when tier omits it", () => {
		const result = resolveTicketPricing({
			basePrice: 0,
			priceTiers: [{ quantity: 3, price: 200 }],
			quantity: 3,
		});

		expect(result.currency).toBe("CNY");
	});

	test("throws when quantity has no supported tier", () => {
		expect(() =>
			resolveTicketPricing({
				basePrice: 99,
				priceTiers: [{ quantity: 2, price: 169 }],
				quantity: 4,
			}),
		).toThrow();
	});
});
