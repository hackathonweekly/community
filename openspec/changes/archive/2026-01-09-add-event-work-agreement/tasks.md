## 1. Implementation
- [x] Add registration agreement config UI: add a form (Markdown editor + preview + reset-to-default) under the registration configuration area in the event admin UI.
- [x] Add submission authorization agreement config UI: add a form (Markdown editor + preview + reset-to-default) under the submissions configuration area in the event admin UI.
- [x] Add default templates: define default Markdown templates for both 《参赛协议》 and 《作品授权协议》, and resolution rules (event override > default).
- [x] Wire event API payload: include both agreement configs when fetching/updating events (store within existing JSON configs).
- [x] Enforce registration agreement on signup: in `src/modules/public/events/components/EventRegistrationForm.tsx`, require checking “I agree” before registration submit, and provide a modal to view rendered Markdown.
- [x] Update submission authorization module: in `src/modules/dashboard/events/components/submissions/EventSubmissionForm.tsx`, update copy, keep default as “agree”, add “view 《作品授权协议》” modal (Markdown-rendered), and add warning UI for “disagree”.
- [x] Enforce “disagree” effects: ensure submissions with `communityUseAuthorization=false` are excluded from public listing/voting/awards and only visible to submitter + organizers/admins.

## 2. Validation
- [x] `pnpm lint`
- [ ] `pnpm type-check` (fails in current repo with TypeScript errors; OOM without `NODE_OPTIONS=--max-old-space-size=8192`)
