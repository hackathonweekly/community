## 1. Implementation
- [x] Update client validation: make `tagline` optional and remove min-length constraint in `src/features/event-submissions/schema.ts`
- [x] Update submission form UI: remove required indicator for tagline and adjust placeholder/copy in `src/modules/dashboard/events/components/submissions/EventSubmissionForm.tsx`
- [x] Update types: allow optional `tagline` in `src/features/event-submissions/types.ts` and adjust any payload normalization accordingly
- [x] Update server validation: make `tagline` optional and remove min-length constraint in `src/server/routes/event-projects.ts`
- [x] Ensure edit flow supports clearing tagline (empty string becomes `null`/unset) in `src/server/routes/event-projects.ts`

## 2. Validation
- [x] `bun lint`
- [ ] `bun type-check` (fails due to existing TypeScript errors outside this change)
