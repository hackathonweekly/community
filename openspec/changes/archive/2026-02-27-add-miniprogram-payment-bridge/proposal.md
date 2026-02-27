# Change: Add Mini Program payment bridge for WeChat Pay with shared prepare API

## Why
Current WeChat Pay flows only distinguish WeChat browser JSAPI vs Native QR. In Mini Program WebView, payment completion is unreliable because the shell app owns the runtime capability (`wx.requestPayment`) while the web app cannot directly guarantee bridge availability/version handling.

## What Changes
- Add a shared WeChat payment preparation API that returns channel-specific payloads for `EVENT_TICKET`.
- Add a Mini Program bridge channel (`MINIPROGRAM_BRIDGE`) for event ticket payments.
- Define a cross-repo bridge contract (H5 <-> Mini Program shell) with version and error-code guarantees.
- Enforce a no-fallback policy for unsupported Mini Program bridge capability (prompt upgrade instead of downgrading to JSAPI/Native).
- Keep existing OpenID data model (no schema change for mini-program OpenID field).

## Impact
- Affected specs: event-ticket-purchase, wechat-payment-orchestration
- Affected code: event order route payload selection, payment modal channel handling, shared payment prepare route/types, mini program shell bridge implementation (external repo)
- Dependencies: Mini Program shell repo release with bridge support and version signaling before enabling this channel in production
