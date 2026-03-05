## 1. Implementation
- [x] 1.1 Update Prisma schema with EventOrder, EventTicketPriceTier, EventOrderInvite, and RegistrationStatus.PENDING_PAYMENT.
- [x] 1.2 Update registration/order creation flow to support quantity, tier pricing, and inventory locking via currentQuantity.
- [x] 1.3 Add event order APIs (create, get status, list, cancel, refund) plus invite listing and redemption.
- [x] 1.4 Implement WeChat Pay provider (Native/JSAPI, refund, webhook validation) and configuration plumbing.
- [x] 1.5 Add order timeout handling and inventory release.
- [x] 1.6 Add payment success email notification and gift invite delivery UX.
- [x] 1.7 Update frontend registration/payment UI for QR modal, JSAPI flow, and invite management.
- [x] 1.8 Add tests for pricing tiers, inventory locking, order lifecycle, webhook idempotency, and invite redemption.
- [x] 1.9 Validate with `pnpm lint` and `pnpm type-check`.
