## ADDED Requirements
### Requirement: Events Token Management UI
Account Settings → Security SHALL include an "Events Token" module that lets eligible users generate, view status for, and revoke the personal API token used for creating events programmatically.

#### Scenario: Eligible user sees empty state and documentation
- **GIVEN** a logged-in user who is allowed to create events but has no active token
- **WHEN** they open Account Settings → Security
- **THEN** the Events Token block explains the API use case, shows that no token exists, and offers a "Generate token" action

#### Scenario: Token generation reveals value once
- **GIVEN** an eligible user clicks "Generate token"
- **WHEN** the token is created server-side
- **THEN** the UI surfaces the full token value exactly once with copy controls, stores metadata (created at, last used), and updates the block to show partial token + regenerate and revoke options afterward

#### Scenario: User can revoke or rotate token self-service
- **GIVEN** a user with an active token opens the module
- **WHEN** they choose revoke or regenerate
- **THEN** the UI confirms the action, clears the stored token state, and reflects the new status (revoked state or newly issued token + created timestamp)

### Requirement: Events Token Lifecycle & Storage
The platform SHALL securely manage at most one active events-token per user, enforce eligibility, and capture audit metadata for monitoring.

#### Scenario: Token stored hashed with metadata
- **WHEN** a new token is created
- **THEN** the backend stores only a salted hash plus createdAt/lastUsed timestamps, leaving the plaintext available only during that response

#### Scenario: Rotation invalidates prior token
- **GIVEN** a user already has an events-token
- **WHEN** they request regeneration
- **THEN** the previous hash becomes unusable immediately, a new hash replaces it, and createdAt/lastUsed reset to the new token

#### Scenario: Revocation and eligibility enforcement
- **GIVEN** a user either loses permission to create events or explicitly revokes their token
- **WHEN** token lifecycle APIs run
- **THEN** the stored hash is deleted, lastUsed cleared, and subsequent token creation attempts are rejected until the user regains eligibility

### Requirement: Events Token API Authentication
The events creation API SHALL accept `Authorization: EventsToken <token>` headers to authenticate as the token owner, apply personal-host rules, and reject invalid or over-scoped calls.

#### Scenario: Valid events-token creates personal event
- **GIVEN** a third-party client sends `POST /api/events` with `Authorization: EventsToken <token>` and a payload omitting organizationId
- **WHEN** the token maps to an active user who can create events
- **THEN** the request succeeds, the event’s organizerId equals the token owner, organizationId is forced to null (personal host), lastUsed metadata updates, and the response mirrors interactive creation

#### Scenario: Invalid, revoked, or expired token rejected
- **WHEN** `/api/events` receives a token that is missing, malformed, revoked, or belongs to a user lacking create permissions
- **THEN** the server returns `401 Unauthorized` (or `403 Forbidden` for permission issues), increments abuse rate limits, and records the failure without touching event data

#### Scenario: Organization overrides blocked for token calls
- **GIVEN** a token-authenticated request includes `organizationId` or tries to impersonate another organizer
- **WHEN** validation runs
- **THEN** the server rejects the request with a clear error explaining that events-token flows only allow personal events, preventing organization assignment or custom organizer IDs
