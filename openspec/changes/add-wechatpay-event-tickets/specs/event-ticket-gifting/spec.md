## ADDED Requirements

### Requirement: Gift invite generation for multi-seat orders
The system SHALL generate shareable invite links for each seat beyond the purchaser in a multi-seat order and associate them with the paid order.

#### Scenario: Multi-seat order creates invites
- **WHEN** a paid order is created with quantity 3
- **THEN** two invite links are generated and linked to the order

### Requirement: Invite redemption creates registrations
The system SHALL allow a recipient to redeem an invite link to create an EventRegistration linked to the order, consuming one available invite.

#### Scenario: Recipient redeems invite
- **WHEN** a recipient redeems a valid invite for a paid order
- **THEN** a registration is created for that recipient
- **AND** the invite is marked as redeemed

### Requirement: Invite invalidation on order termination
The system SHALL invalidate unredeemed invites when the order is CANCELLED, expired, or refunded, preventing further redemption.

#### Scenario: Cancelled order invalidates invites
- **WHEN** an order is cancelled before all invites are redeemed
- **THEN** remaining invites cannot be redeemed

### Requirement: Purchaser invite visibility
The system SHALL allow the purchaser to list invite links and their redemption status for a paid order.

#### Scenario: Purchaser views invites
- **WHEN** the purchaser requests invite details for their paid order
- **THEN** the response includes invite links and redemption status
