## ADDED Requirements

### Requirement: Paid ticket order creation
The system SHALL create an EventOrder when a user submits a paid event registration, lock inventory by incrementing EventTicketType.currentQuantity by the order quantity, and create an EventRegistration with status PENDING_PAYMENT.

#### Scenario: Paid registration creates a pending order
- **WHEN** an authenticated user submits a paid ticket registration with a valid ticket type and quantity
- **THEN** an EventOrder is created with status PENDING and expiredAt set
- **AND** the registration is created with status PENDING_PAYMENT
- **AND** currentQuantity is incremented by the order quantity

### Requirement: Inventory enforcement uses currentQuantity
The system SHALL reject order creation when EventTicketType.currentQuantity plus the requested quantity exceeds maxQuantity.

#### Scenario: Insufficient inventory
- **WHEN** a user requests more seats than available based on currentQuantity and maxQuantity
- **THEN** the order is rejected with an inventory error

### Requirement: Tiered pricing by quantity
The system SHALL allow each ticket type to define pricing tiers by quantity and SHALL only allow purchase quantities that have a defined tier.

#### Scenario: Tier price is applied
- **WHEN** a ticket type has tiers for quantities 1 and 2 and the user selects quantity 2
- **THEN** the order totalAmount matches the tier price for quantity 2

### Requirement: Free ticket registration
The system SHALL skip EventOrder creation for tickets with a zero price and SHALL create a registration with status APPROVED or PENDING based on event.requireApproval while incrementing currentQuantity.

#### Scenario: Free ticket registration
- **WHEN** a user selects a free ticket type
- **THEN** no EventOrder is created
- **AND** the registration status follows event.requireApproval
- **AND** currentQuantity is incremented

### Requirement: WeChat Pay payment method selection
The system SHALL return Native payment details for non-WeChat browsers and JSAPI payment parameters for WeChat browsers, recording the selected paymentMethod on the order.

#### Scenario: JSAPI payment in WeChat browser
- **WHEN** the client is a WeChat browser requesting payment
- **THEN** the response includes JSAPI parameters for invoking WeChat Pay

### Requirement: Payment success handling
The system SHALL validate WeChat Pay webhook signatures, verify amount and currency, and idempotently update the order to PAID while updating the associated registration to APPROVED or PENDING and sending a payment success notification.

#### Scenario: First successful payment callback
- **WHEN** a valid payment notification is received for a PENDING order
- **THEN** the order status becomes PAID with transactionId and paidAt set
- **AND** the registration status is updated based on event.requireApproval
- **AND** a payment success notification is sent

### Requirement: Order cancellation and expiration
The system SHALL allow user-initiated cancellations and scheduled expirations to set the order status to CANCELLED, set related registrations to CANCELLED, and decrement currentQuantity by the order quantity.

#### Scenario: Expired order is cancelled
- **WHEN** the order expires without payment
- **THEN** the order status becomes CANCELLED
- **AND** related registrations are marked CANCELLED
- **AND** currentQuantity is decremented by the order quantity

### Requirement: Admin refunds
The system SHALL allow admins to initiate refunds for PAID orders and SHALL update order status to REFUND_PENDING; on refund success, the order SHALL be marked REFUNDED and related registrations SHALL be marked CANCELLED while releasing inventory.

#### Scenario: Refund completion
- **WHEN** a refund succeeds for a paid order
- **THEN** the order status becomes REFUNDED
- **AND** related registrations are marked CANCELLED
- **AND** currentQuantity is decremented by the order quantity

### Requirement: Order status APIs
The system SHALL provide APIs to create orders, fetch order status, list a user's orders for an event, and cancel orders.

#### Scenario: User checks order status
- **WHEN** the user requests the status of their order
- **THEN** the response includes order status, totalAmount, expiredAt, and registration summary
