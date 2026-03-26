# Change: Add a prominent home button on the mobile login page

## Why
The auth layout currently shows the site logo in the header, but the mobile login page does not provide an obvious, primary-feeling path back to the public homepage from within the main login content. This makes the mobile login entry feel isolated when users arrive from redirects, shared links, or mistaken taps.

## What Changes
- Add a mobile-only, visually prominent "返回首页" action on `/auth/login`.
- Keep the existing desktop login layout and login-method flow unchanged.
- Limit this change to the main login page; phone, email, signup, and recovery sub-pages are out of scope for this proposal.

## Impact
- Affected specs: `auth-mobile-navigation`
- Affected code: `apps/web/src/app/(app)/auth/login/page.tsx`, `apps/web/src/modules/account/auth/components/LoginMethodSelector.tsx`, and any minimal auth wrapper styling needed to surface the button on mobile
