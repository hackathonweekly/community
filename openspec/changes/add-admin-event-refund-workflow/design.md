## Context
The event ticket system already supports paid order creation, payment settlement, and refund settlement through WeChat webhook callbacks. However, organizer-side registration management does not expose a direct refund action, while organizer cancellation endpoints can still cancel registrations that are tied to paid orders. This leaves a gap between payment lifecycle and registration lifecycle.

## Goals / Non-Goals
- Goals:
  - Provide a clear organizer workflow to process basic refunds in-site.
  - Prevent paid registrations from being cancelled outside the refund lifecycle.
  - Keep settlement source of truth on payment backend/webhook processing.
- Non-Goals:
  - User self-service refund entry.
  - Partial refunds or rule-based (time-tiered) refunds.
  - Stripe or other provider refund support.

## Decision Summary
1. **Refund-first lifecycle for paid registrations**
   - For registrations bound to paid orders, cancellation from registration endpoints is blocked.
   - Organizer must initiate refund from order context.
2. **Full refund only in V1**
   - Organizer-facing flow only supports full refund (`order.totalAmount`).
   - API compatibility for optional amount can remain internally, but product flow and policy are full-refund only.
3. **No optimistic registration cancellation**
   - Registration remains active until refund success settlement is confirmed.
   - `REFUND_PENDING` is visible in organizer UI to communicate in-flight state.
4. **Failure safety**
   - If refund initiation fails, order remains `PAID`; registration remains unchanged.
   - Organizer gets actionable error and can retry.

## End-to-End Flow
1. Organizer opens registration details for a paid order (`order.status = PAID`).
2. Organizer submits refund reason from management UI.
3. Backend validates organizer permission and paid status, requests WeChat refund, updates order to `REFUND_PENDING`.
4. WeChat webhook `REFUND.SUCCESS` triggers final settlement:
   - order status -> `REFUNDED`
   - related registrations -> `CANCELLED`
   - inventory release performed by existing refund settlement logic.

## Trade-offs
- Pros:
  - Strong consistency between financial state and registration state.
  - Minimal scope for first release with existing backend capabilities.
- Cons:
  - Organizers cannot force immediate cancellation before refund settlement.
  - No partial refund flexibility in first iteration.

## Rollout and Validation
- Rollout is backward-compatible and incremental: expose new UI action, tighten cancellation guardrails for paid registrations, keep existing webhook settlement unchanged.
- Validate with route tests, order lifecycle tests, and organizer UI interaction checks for `PAID -> REFUND_PENDING -> REFUNDED` visibility.
