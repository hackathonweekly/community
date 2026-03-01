# Change: Add admin-managed event refund workflow

## Why
Paid event registrations currently support backend refund APIs, but organizers lack a complete in-site workflow to process basic refunds safely. Organizers can still cancel paid registrations directly from registration management, which can create inconsistent states and operational confusion.

## What Changes
- Add organizer-facing refund action in event registration management for paid orders.
- Enforce a strict lifecycle for paid registrations: refund first, then registration is cancelled by refund settlement.
- Standardize V1 refund policy for event orders to full-refund-only via organizer operation.
- Keep refund failure behavior explicit: if refund request fails, order stays `PAID` and registration is not cancelled.

## Impact
- Affected specs: `event-ticket-purchase`
- Affected code:
  - `apps/web/src/modules/account/events/components/RegistrationDetailsDialog.tsx`
  - `apps/web/src/modules/account/events/hooks/useEventManagement.ts`
  - `apps/web/src/server/routes/events/orders.ts`
  - `apps/web/src/server/routes/events/registrations.ts`
  - `packages/lib-shared/src/i18n/translations/zh.json`
  - `packages/lib-shared/src/i18n/translations/en.json`
- Backward compatibility:
  - Existing webhook-based refund settlement remains source of truth.
  - No new payment provider support in this change (WeChat only for now).
