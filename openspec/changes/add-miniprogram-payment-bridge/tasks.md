## 1. Shared WeChat payment orchestration
- [ ] 1.1 Add `POST /api/payments/wechat/prepare` for `EVENT_TICKET` and channelized payload output.
- [ ] 1.2 Add shared server/client types for `channel`, `payPayload`, and standardized error codes.
- [ ] 1.3 Add channel-selection logic with precedence: Mini Program bridge -> WeChat JSAPI -> Native.

## 2. Event ticket payment flow integration
- [ ] 2.1 Update event order creation flow to consume the shared prepare capability and return `channel` + `payPayload`.
- [ ] 2.2 Keep a one-release compatibility layer for legacy JSAPI/Native response fields.
- [ ] 2.3 Enforce `MINI_PROGRAM_BRIDGE_REQUIRED` behavior (no fallback) when Mini Program bridge is unavailable.

## 3. Frontend payment modal behavior
- [ ] 3.1 Add `MINIPROGRAM_BRIDGE` handling in payment modal and call bridge `requestPayment` path.
- [ ] 3.2 Add upgrade prompt UI for bridge-required errors and block payment launch.
- [ ] 3.3 Preserve existing polling/manual-query reconciliation after bridge callback.

## 4. Cross-repo bridge contract and shell implementation
- [ ] 4.1 Publish and version the H5 <-> shell bridge contract in this repo.
- [ ] 4.2 Implement same contract in Mini Program shell repo (capability reporting + `wx.requestPayment` mapping).
- [ ] 4.3 Add shell error mapping to agreed error codes and callback payload shape.

## 5. Validation and rollout
- [ ] 5.1 Add tests for channel selection, payload shape, bridge-required behavior, and status reconciliation.
- [ ] 5.2 Add metrics/log fields for `channel`, `shellVersion`, `bridgeVersion`, and Mini Program bridge errors.
- [ ] 5.3 Validate with `openspec validate add-miniprogram-payment-bridge --strict`.
