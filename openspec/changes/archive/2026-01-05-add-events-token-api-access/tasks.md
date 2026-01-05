## 1. Implementation
- [x] 1.1 Design and migrate persistence for a single hashed events-token per user (with created/lastUsed metadata and audit logging)
- [x] 1.2 Build secure APIs under account settings to create, reveal-once, rotate, and revoke the events-token with membership eligibility checks
- [x] 1.3 Add the "Events Token" module to Account Settings → Security explaining usage, exposing copy/regenerate controls, and surfacing last used info
- [x] 1.4 Update `/api/events` auth to accept `Authorization: EventsToken <token>` headers, resolve the user, and ensure resulting events are tied to the token owner as a personal organizer without organization overrides
- [x] 1.5 Enforce telemetry/rate limits for token-based calls and document the request format + limitations (personal events only, no organizationId)

## 2. Validation
- [x] 2.1 Unit/integration tests covering token lifecycle, revocation, and POST /api/events authorization paths
- [x] 2.2 Security review of token storage, logging of reveal, and abuse monitoring
