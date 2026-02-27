# wechat-payment-orchestration Specification

## Purpose
TBD - created by archiving change add-miniprogram-payment-bridge. Update Purpose after archive.
## Requirements
### Requirement: Shared WeChat payment prepare API
The system SHALL provide a shared API to prepare WeChat payment payloads for business flows.

#### Scenario: Prepare API returns channelized payload for event ticket
- **WHEN** the client calls `POST /api/payments/wechat/prepare` with `bizType = EVENT_TICKET` and valid order identity
- **THEN** the response includes `channel`, `orderNo`, `expiredAt`, and channel-specific `payPayload`

### Requirement: Deterministic channel selection precedence
The system SHALL apply deterministic precedence for WeChat payment channel selection.

#### Scenario: Environment is Mini Program and bridge is available
- **WHEN** client context indicates Mini Program WebView with supported bridge capability
- **THEN** selected channel is `MINIPROGRAM_BRIDGE`
- **AND** JSAPI/Native channels are not selected

#### Scenario: Environment is WeChat browser outside Mini Program
- **WHEN** client context indicates WeChat browser and not Mini Program bridge mode
- **THEN** selected channel is `WECHAT_JSAPI`

#### Scenario: Environment is non-WeChat browser
- **WHEN** client context is outside WeChat runtime
- **THEN** selected channel is `WECHAT_NATIVE`

### Requirement: Standardized Mini Program bridge error semantics
The system SHALL expose normalized error codes for Mini Program bridge capability and invocation failures.

#### Scenario: Bridge version is unsupported
- **WHEN** the bridge version is lower than required minimum
- **THEN** the API returns `MINI_PROGRAM_BRIDGE_REQUIRED`
- **AND** the response indicates upgrade is required

#### Scenario: Bridge invocation reports cancellation
- **WHEN** shell bridge reports payment cancellation
- **THEN** the client receives `MINI_PROGRAM_PAY_CANCELLED`
- **AND** order remains in payable state until expiration or explicit cancellation

### Requirement: Backward compatibility for transition release
The system SHALL keep legacy payment response fields for one transition release while introducing canonical `channel` and `payPayload` fields.

#### Scenario: Legacy client reads historical fields
- **WHEN** a client has not switched to `channel` and `payPayload`
- **THEN** existing JSAPI or Native legacy response fields remain available during the transition period

