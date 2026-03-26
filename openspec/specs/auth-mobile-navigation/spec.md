# auth-mobile-navigation Specification

## Purpose
TBD - created by archiving change add-mobile-login-home-button. Update Purpose after archive.
## Requirements
### Requirement: Mobile login page provides a prominent homepage return action
The system SHALL display a visually prominent action that returns the user to the public homepage when the user visits the main login page on a mobile viewport.

#### Scenario: Mobile user opens the main login page
- **WHEN** an unauthenticated user visits `/auth/login` on a mobile viewport
- **THEN** the page shows a clearly visible "返回首页" action within the primary login experience
- **AND** the action navigates to `/`
- **AND** the user can reach the action without scrolling past the main login method controls

#### Scenario: Desktop login layout remains unchanged
- **WHEN** an unauthenticated user visits `/auth/login` on a desktop viewport
- **THEN** the existing desktop login layout remains available
- **AND** any new homepage return action added for mobile does not introduce duplicate primary navigation in the desktop layout

