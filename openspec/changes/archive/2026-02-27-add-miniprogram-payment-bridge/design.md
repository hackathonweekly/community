## Context
Event ticket WeChat Pay currently returns either JSAPI parameters (WeChat browser) or Native QR (`codeUrl`) based on user agent. Mini Program users access the same H5 pages inside a shell WebView, but payment invocation should be executed by shell-native APIs (`wx.requestPayment`) through a bridge.

Without an explicit bridge contract and capability checks, Mini Program users can enter a broken payment flow. We also need to avoid duplicating channel-selection logic across future WeChat payment entry points.

## Goals / Non-Goals
- Goals:
  - Add a shared WeChat payment preparation orchestration API for channel selection and payload shaping.
  - Support Mini Program bridge payment for event tickets.
  - Define strict cross-repo bridge contract and error semantics.
  - Keep payment lifecycle consistency (webhook idempotency and manual query remain source of truth).
- Non-Goals:
  - Full migration of all existing payment entry points in one release.
  - Introducing JS auto-fallback for Mini Program bridge failures.
  - New OpenID schema design.

## Decisions
- Decision: Introduce a shared prepare API.
  - Add `POST /api/payments/wechat/prepare` with `bizType` and `bizId`.
  - Initial `bizType` support is `EVENT_TICKET` only.
  - Response always includes `channel` and channel-specific `payPayload`.

- Decision: Canonical channel model.
  - Channels: `MINIPROGRAM_BRIDGE`, `WECHAT_JSAPI`, `WECHAT_NATIVE`.
  - Selection precedence:
    1) Mini Program WebView + bridge capability confirmed => `MINIPROGRAM_BRIDGE`
    2) WeChat browser => `WECHAT_JSAPI`
    3) others => `WECHAT_NATIVE`

- Decision: Mini Program bridge hard requirement.
  - If Mini Program environment is detected but bridge capability/version is missing, return `MINI_PROGRAM_BRIDGE_REQUIRED`.
  - Frontend must show upgrade guidance and stop payment start.
  - Do not downgrade automatically to JSAPI or Native QR in Mini Program context.

- Decision: No data-model change for OpenID.
  - Continue using existing user OpenID field currently used for WeChat JSAPI.
  - Do not add `miniOpenId` in this change.

- Decision: Order and status truth model unchanged.
  - Payment completion truth remains webhook + explicit order status query endpoints.
  - Bridge callback is only trigger feedback, not final settlement source.

- Decision: Response compatibility.
  - Event ticket order create response adds `channel` and `payPayload` while keeping existing JSAPI/Native fields for one transition release.
  - Frontend prioritizes `channel` + `payPayload` and only uses legacy fields as backward compatibility.

## Bridge Contract
See `contracts/miniprogram-bridge.md` for the exact interface, version floor, and error-code mapping shared with the shell repo.

## Risks / Trade-offs
- Enforcing upgrade (no fallback) may temporarily reduce conversion for old shell versions.
- Cross-repo release coordination becomes a hard dependency.
- Dual payload format during transition increases temporary complexity.

## Migration Plan
1. Ship shell bridge contract implementation and expose capability/version reporting.
2. Ship shared prepare API and channelized payload response.
3. Update event ticket frontend modal to bridge mode handling.
4. Enable Mini Program bridge channel behind feature flag/version gate.
5. Remove legacy response field usage after rollout stabilization.

## Rollout & Monitoring
- Add metrics by payment channel and error code.
- Monitor `MINI_PROGRAM_BRIDGE_REQUIRED` rate and payment completion rates by channel.
- Alert on webhook delay and query reconciliation mismatch spikes.

## Open Questions
- None.
