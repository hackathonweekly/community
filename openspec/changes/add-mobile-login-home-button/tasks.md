## 1. Implementation
- [ ] 1.1 Add a mobile-only, visually prominent home navigation action to the `/auth/login` experience.
- [ ] 1.2 Ensure the new action routes to `/` and remains visible without scrolling past the primary login methods on common mobile viewports.
- [ ] 1.3 Verify the desktop login layout does not gain duplicate primary navigation or regress visually.

## 2. Validation
- [ ] 2.1 Run targeted UI verification for `/auth/login` on mobile and desktop breakpoints.
- [ ] 2.2 Run `openspec validate add-mobile-login-home-button --strict`.
