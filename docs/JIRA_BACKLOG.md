# APMS JIRA Backlog

## Epics

### EPIC-001: Core Parking Management System
**Description**: Implement core parking functionality including LPR, space allocation, and barrier control
**Story Points**: 40
**Status**: Completed

### EPIC-002: Payment and Billing System
**Description**: Implement automated billing, payment processing, and receipt generation
**Story Points**: 25
**Status**: Completed

### EPIC-003: Admin Dashboard and Monitoring
**Description**: Build comprehensive admin dashboard with real-time monitoring and analytics
**Story Points**: 35
**Status**: Completed

### EPIC-004: DevOps and Infrastructure
**Description**: Set up CI/CD, Docker, testing infrastructure
**Story Points**: 20
**Status**: Completed

## Sprint 1: Core Foundation (2 weeks)

### US-001: Automatic License Plate Recognition
**Epic**: EPIC-001
**Story Points**: 8
**Priority**: High
**Acceptance Criteria**:
- System can accept base64 image input
- Returns detected license plate number
- Simulates processing delay (configurable)
- Includes failure simulation for testing
- Response time < 2 seconds

**Tasks**:
- [ ] Create LPR service with plate generation algorithm
- [ ] Implement API endpoint POST /identify
- [ ] Add image validation
- [ ] Write unit tests for LPR service
- [ ] Add system event logging

### US-002: Parking Space Allocation
**Epic**: EPIC-001
**Story Points**: 13
**Priority**: High
**Acceptance Criteria**:
- Allocates nearest available space
- Prevents double allocation (thread-safe)
- Supports zone and floor preferences
- Updates space status to "occupied"
- Creates parking session record

**Tasks**:
- [ ] Implement parking service with allocation logic
- [ ] Add database transaction handling
- [ ] Create API endpoint POST /parking/allocate
- [ ] Implement space preference logic
- [ ] Write integration tests for allocation flow

### US-003: Entry Barrier Control
**Epic**: EPIC-001
**Story Points**: 5
**Priority**: High
**Acceptance Criteria**:
- Opens entry barrier on command
- Simulates hardware delay
- Logs system event
- Returns confirmation

**Tasks**:
- [ ] Create barrier service
- [ ] Implement POST /barrier/entry endpoint
- [ ] Add animation delay simulation
- [ ] Write tests for barrier control

### US-004: Database Schema and Migrations
**Epic**: EPIC-004
**Story Points**: 8
**Priority**: High
**Acceptance Criteria**:
- All tables created with proper relationships
- Foreign keys and constraints in place
- Indexes on frequently queried fields
- Seed data for development

**Tasks**:
- [ ] Design database schema
- [ ] Create Sequelize models
- [ ] Write migration files
- [ ] Create seed data
- [ ] Test migrations

**Sprint 1 Total**: 34 Story Points

## Sprint 2: Payment and Admin Features (2 weeks)

### US-005: Billing Calculation
**Epic**: EPIC-002
**Story Points**: 5
**Priority**: High
**Acceptance Criteria**:
- Calculates fee based on duration
- Rounds up to nearest hour
- Supports hourly rate configuration
- Handles first hour free option

**Tasks**:
- [ ] Implement pricing calculator utility
- [ ] Add configuration via environment variables
- [ ] Write comprehensive unit tests for all pricing scenarios
- [ ] Document pricing rules

### US-006: Payment Processing
**Epic**: EPIC-002
**Story Points**: 13
**Priority**: High
**Acceptance Criteria**:
- Creates payment transaction
- Simulates payment gateway
- Generates receipt number
- Updates session and space on confirmation
- Supports multiple payment methods

**Tasks**:
- [ ] Create payment service
- [ ] Implement POST /payment/create endpoint
- [ ] Implement POST /payment/confirm endpoint
- [ ] Add transaction handling
- [ ] Write integration tests for payment flow

### US-007: Exit Workflow
**Epic**: EPIC-001
**Story Points**: 8
**Priority**: High
**Acceptance Criteria**:
- Completes parking session
- Opens exit barrier
- Releases parking space
- Full end-to-end flow works

**Tasks**:
- [ ] Implement exit barrier control
- [ ] Add space release logic
- [ ] Write system test for complete cycle
- [ ] Test error scenarios

### US-008: Admin Dashboard - Occupancy View
**Epic**: EPIC-003
**Story Points**: 8
**Priority**: Medium
**Acceptance Criteria**:
- Shows real-time occupancy stats
- Displays space grid with status colors
- Auto-refreshes every 5 seconds
- Shows breakdown by floor and zone

**Tasks**:
- [ ] Create admin service methods
- [ ] Implement GET /admin/occupancy endpoint
- [ ] Build OccupancyView React component
- [ ] Add auto-refresh logic
- [ ] Style with color-coded spaces

### US-009: Admin Dashboard - Revenue Analytics
**Epic**: EPIC-003
**Story Points**: 8
**Priority**: Medium
**Acceptance Criteria**:
- Shows revenue by date
- Displays transaction count
- Includes chart visualization
- Supports date range filtering

**Tasks**:
- [ ] Implement GET /admin/revenue endpoint
- [ ] Create RevenueChart component
- [ ] Integrate Recharts library
- [ ] Add date range filters
- [ ] Write admin integration tests

**Sprint 2 Total**: 42 Story Points

## Sprint 3: Terminal UI and Testing (1.5 weeks)

### US-010: Terminal UI - Entry Flow
**Epic**: EPIC-001
**Story Points**: 13
**Priority**: High
**Acceptance Criteria**:
- Upload or simulate image
- Show detected plate
- Display allocated space
- Barrier opening animation
- Large fonts and high contrast

**Tasks**:
- [ ] Create EntryFlow component
- [ ] Implement image upload
- [ ] Add step-by-step workflow
- [ ] Create BarrierAnimation component
- [ ] Apply accessibility styles

### US-011: Terminal UI - Exit Flow
**Epic**: EPIC-002
**Story Points**: 13
**Priority**: High
**Acceptance Criteria**:
- Enter license plate
- Show parking duration
- Display calculated fee
- Process payment simulation
- Exit barrier animation

**Tasks**:
- [ ] Create ExitFlow component
- [ ] Implement payment summary display
- [ ] Add payment processing workflow
- [ ] Reuse BarrierAnimation component
- [ ] Test full exit flow

### US-012: System Logging and Monitoring
**Epic**: EPIC-003
**Story Points**: 8
**Priority**: Medium
**Acceptance Criteria**:
- All actions logged with timestamp
- Includes user, action, resource
- Admin can view and filter logs
- Logs stored in database

**Tasks**:
- [ ] Implement logging middleware
- [ ] Create Log model
- [ ] Build LogsView component
- [ ] Add filtering options
- [ ] Write tests

### US-013: CI/CD Pipeline
**Epic**: EPIC-004
**Story Points**: 13
**Priority**: High
**Acceptance Criteria**:
- Automated build on push
- Runs all test suites
- Generates coverage report (>75%)
- Runs linting and security scans
- Creates deployment artifact

**Tasks**:
- [ ] Create GitHub Actions workflow
- [ ] Configure test jobs
- [ ] Add coverage threshold check
- [ ] Set up artifact upload
- [ ] Test pipeline end-to-end

**Sprint 3 Total**: 47 Story Points

## Backlog (Future Enhancements)

### US-014: Mobile App
**Story Points**: 21
**Description**: Native mobile app for drivers

### US-015: Advanced Analytics
**Story Points**: 13
**Description**: ML-based demand prediction

### US-016: Integration with Payment Gateways
**Story Points**: 13
**Description**: Real Stripe/PayPal integration

### US-017: Multi-Location Support
**Story Points**: 21
**Description**: Support multiple parking facilities

## Burndown Chart (Sprint 2)

```
Story Points
 50 |●
 40 |  ●
 30 |    ●
 20 |      ●
 10 |        ●
  0 |__________●
    Day 1  5  10 14
```

## Team Velocity

- Sprint 1: 34 points completed
- Sprint 2: 42 points completed
- Sprint 3: 47 points (estimated)
- Average Velocity: 41 points/sprint

## Definition of Done

- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing (if applicable)
- [ ] Code coverage meets threshold
- [ ] Documentation updated
- [ ] Deployed to development environment
- [ ] Acceptance criteria validated
