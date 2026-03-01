## 1. Backend guardrails and refund policy
- [x] 1.1 Update organizer registration cancellation endpoint to reject cancellations for paid or refund-pending orders with clear error messaging.
- [x] 1.2 Ensure organizer refund endpoint follows full-refund-only behavior in the management workflow and preserves `PAID` state on initiation failure.
- [x] 1.3 Verify refund initiation continues to set `REFUND_PENDING`, with final `REFUNDED` settlement driven by webhook processing.

## 2. Organizer management UI
- [x] 2.1 Add a "refund and cancel registration" action in registration details when order status is `PAID`.
- [x] 2.2 Add confirmation dialog with mandatory refund reason and explicit lifecycle copy.
- [x] 2.3 Reflect and gate status states in UI (`REFUND_PENDING`, `REFUNDED`) so cancellation is not offered for paid orders outside refund flow.

## 3. Copy and localization
- [x] 3.1 Add/adjust zh/en translation keys for refund action labels, confirmation, in-progress, and failure-retry feedback.

## 4. Validation
- [x] 4.1 Add or update backend tests for paid-registration cancellation guard and refund initiation constraints.
- [x] 4.2 Add or update UI tests (or focused interaction coverage) for organizer refund action visibility and state transitions.
- [x] 4.3 Run `pnpm type-check` and targeted test suites covering events/orders/registrations.
- [x] 4.4 Run `openspec validate add-admin-event-refund-workflow --strict`.
