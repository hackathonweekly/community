## Context
Event registration currently creates EventRegistration records immediately and relies on registration counts for inventory checks. WeChat Pay is stubbed, and there is no event order model for paid tickets. The requested change adds WeChat Pay Native/JSAPI, multi-seat pricing, and gifting while keeping an audit trail for cancellations.

## Goals / Non-Goals
- Goals:
  - Support paid event tickets via WeChat Pay Native and JSAPI flows.
  - Support tiered pricing per ticket quantity and multi-seat orders.
  - Support giftable seats via invite links tied to paid orders.
  - Use EventTicketType.currentQuantity as the single inventory source of truth.
  - Keep registrations for audit by marking them CANCELLED on timeout/cancel/refund.
- Non-Goals:
  - Subscription billing or non-WeChat payment providers.
  - Cross-event ticket bundles or transfers between events.

## Decisions
- Decision: Data model additions
  - Add EventOrder and related enums (EventOrderStatus, PaymentMethod).
  - Add RegistrationStatus.PENDING_PAYMENT.
  - Add EventTicketPriceTier to store quantity-based pricing per ticket type.
  - Add EventOrderInvite to store gift invite links and redemption status.
  - Add relations between EventOrder, EventRegistration, EventTicketType, and User.

- Decision: Tiered pricing enforcement
  - Order creation SHALL only allow quantities that have a defined pricing tier for the selected ticket type.
  - The order totalAmount is taken from the tier price, not unitPrice * quantity.

- Decision: Order creation flow
  - On paid ticket submission, create EventRegistration with PENDING_PAYMENT, create EventOrder with status PENDING, and increment EventTicketType.currentQuantity by order quantity.
  - Set expiredAt based on config (default 30 minutes).
  - For free tickets, skip EventOrder creation and set registration status to APPROVED or PENDING based on event.requireApproval, while still incrementing currentQuantity.

- Decision: Gift invite flow
  - For orders with quantity > 1, create EventOrderInvite records for quantity - 1 seats.
  - Invites become redeemable only after the order is PAID.
  - Redeeming an invite creates a new EventRegistration linked to the order and consumes one invite.

- Decision: Inventory tracking
  - Inventory checks use EventTicketType.currentQuantity and maxQuantity; reject orders when currentQuantity + requested quantity exceeds maxQuantity.
  - Inventory is released by decrementing currentQuantity when an order is CANCELLED, expires, or is refunded.

- Decision: Webhook validation and idempotency
  - WeChat Pay webhook handling SHALL validate signatures, verify amounts/currency, and apply idempotent updates based on order status.

- Decision: Order lifecycle endpoints
  - Provide endpoints for creating orders, fetching status, listing a user's orders, cancelling orders, and refunding (admin).
  - Provide endpoints to list gift invites for an order and redeem invites.

## Risks / Trade-offs
- Tiered pricing limits allowed quantities to defined tiers, which is simpler but requires admin setup for each quantity.
- Holding inventory for unredeemed gift seats reduces availability until an order is cancelled or refunded.
- Using currentQuantity as the sole inventory source requires careful migration to avoid mismatches with existing data.

## Migration Plan
- Add Prisma migration for new enums/models and relationships.
- Backfill EventTicketType.currentQuantity based on existing registrations if needed, then rely exclusively on currentQuantity going forward.
- Deploy webhook handling and order APIs before enabling the WeChat Pay provider in production.

## Open Questions
- None.
