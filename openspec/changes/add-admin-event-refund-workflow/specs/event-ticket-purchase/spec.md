## ADDED Requirements
### Requirement: Organizer-managed refunds for paid event orders
The system SHALL allow authorized event organizers to initiate refunds for paid event orders from event management workflows, and SHALL move the order to `REFUND_PENDING` after successful refund initiation.

#### Scenario: Organizer initiates refund for a paid order
- **WHEN** an authorized organizer submits a refund request for an event order with status `PAID`
- **THEN** the system initiates a WeChat refund request for the order total amount
- **AND** the order status becomes `REFUND_PENDING`
- **AND** the registration is not immediately cancelled until refund settlement succeeds

#### Scenario: Refund initiation fails
- **WHEN** refund initiation returns an error from the payment provider
- **THEN** the API returns an actionable failure response
- **AND** the order remains in `PAID`
- **AND** related registrations remain unchanged

### Requirement: Paid registrations must follow refund-first cancellation lifecycle
The system SHALL block organizer-side registration cancellation for registrations tied to paid or refund-pending orders, requiring refund settlement to drive cancellation.

#### Scenario: Organizer attempts to cancel a paid registration directly
- **WHEN** an organizer calls registration cancellation for a registration linked to an order in `PAID` or `REFUND_PENDING`
- **THEN** the request is rejected with a validation error
- **AND** the response instructs organizer to use the refund workflow

### Requirement: Refund settlement finalizes order and registration lifecycle
The system SHALL finalize a refunded order through settlement events by marking the order as `REFUNDED` and cancelling related registrations.

#### Scenario: Refund settlement succeeds
- **WHEN** refund settlement is confirmed for an order in `REFUND_PENDING`
- **THEN** the order status becomes `REFUNDED`
- **AND** related registrations become `CANCELLED`
- **AND** ticket inventory is released according to existing order lifecycle rules
