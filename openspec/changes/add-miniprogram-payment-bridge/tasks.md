## 1. Shared WeChat payment orchestration
- [x] 1.1 Add `POST /api/payments/wechat/prepare` for `EVENT_TICKET` and channelized payload output.
- [x] 1.2 Add shared server/client types for `channel`, `payPayload`, and standardized error codes.
- [x] 1.3 Add channel-selection logic with precedence: Mini Program bridge -> WeChat JSAPI -> Native.

## 2. Event ticket payment flow integration
- [x] 2.1 Update event order creation flow to consume the shared prepare capability and return `channel` + `payPayload`.
- [x] 2.2 Keep a one-release compatibility layer for legacy JSAPI/Native response fields.
- [x] 2.3 Enforce `MINI_PROGRAM_BRIDGE_REQUIRED` behavior (no fallback) when Mini Program bridge is unavailable.

## 3. Frontend payment modal behavior
- [x] 3.1 Add `MINIPROGRAM_BRIDGE` handling in payment modal and call bridge `requestPayment` path.
- [x] 3.2 Add upgrade prompt UI for bridge-required errors and block payment launch.
- [x] 3.3 Preserve existing polling/manual-query reconciliation after bridge callback.

## 4. Cross-repo bridge contract and shell implementation
- [x] 4.1 Publish and version the H5 <-> shell bridge contract in this repo.
- [ ] 4.2 Implement same contract in Mini Program shell repo (capability reporting + `wx.requestPayment` mapping). _(blocked in this repository; requires external shell repo changes)_
- [ ] 4.3 Add shell error mapping to agreed error codes and callback payload shape. _(blocked in this repository; requires external shell repo changes)_

## 5. Validation and rollout
- [x] 5.1 Add tests for channel selection and bridge-required behavior.
- [x] 5.2 Add metrics/log fields for `channel`, `shellVersion`, `bridgeVersion`, and Mini Program bridge errors.
- [x] 5.3 Validate with `openspec validate add-miniprogram-payment-bridge --strict`.
