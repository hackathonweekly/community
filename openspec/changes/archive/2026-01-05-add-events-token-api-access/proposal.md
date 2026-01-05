# Change: Add events-token authentication for event creation API

## Why
Partners want to trigger HackathonWeekly event creation from their own tools without sharing account credentials. Today the `/api/events` endpoint only accepts interactive Better Auth sessions. We need a secure token workflow so users can mint and revoke an "events-token" and authorize third-party API calls that still produce personal-hosted events under their accounts.

## What Changes
- Expose an "Events Token" block inside Account Settings → Security so users can generate, rotate, and revoke a personal API token (default empty until explicitly created).
- Persist tokens securely (hashed + metadata), enforce one active token per user, and block creation for members who cannot create events.
- Extend `/api/events` to accept `Authorization: EventsToken <token>` headers that authenticate as the token owner, automatically create "personal" events (no organization override), and enforce the same rate limits / validations as interactive flows.
- Add guardrails: usage logging, last-used timestamps, ability to revoke, and documentation/in-app copy describing how third parties call the API.

## Impact
- Affected specs: events-api-token (new capability)
- Affected code: account settings security UI, auth/token storage, `/api/events` handler, rate limiting/logging, docs explaining token usage
