# Change: Add WeChat Pay event ticket orders with gifting and tiered pricing

## Why
Paid event tickets need WeChat Pay (Native/JSAPI), multi-seat pricing, and giftable seats while preserving inventory locking and audit-friendly cancellations.

## What Changes
- Add EventOrder lifecycle for paid event tickets with WeChat Pay webhook handling.
- Add tiered pricing by quantity and gift invite links for multi-seat purchases.
- Track inventory with EventTicketType.currentQuantity and a PENDING_PAYMENT registration state.
- Add order timeout cancellation and refund handling that keep registrations for audit.

## Impact
- Affected specs: event-ticket-purchase, event-ticket-gifting
- Affected code: Prisma schema, event registration flow, payment provider, webhooks, event order API routes, cron job, email notifications, frontend registration/payment UI.
