# Multi-Tenancy Architecture

This document explains the multi-tenancy support in Streetwise, enabling both free-tier individual users and white-label organizational deployments.

## Overview

Streetwise supports two deployment models:

1. **Free Tier**: Individual users track their own donations with no organizational affiliation
2. **Organization Tier**: White-label deployments for shelters, outreach orgs, and social services

## Database Schema

### New Tables

#### Organizations
Represents entities that deploy white-label versions of the app.

```typescript
{
  id: string (UUID)
  name: string              // Organization name
  tier: string              // 'free' | 'basic' | 'professional' | 'enterprise'
  features: jsonb           // Feature flags per org
  subdomain: string         // Optional subdomain for white-label
  branding: jsonb           // Logo, colors, custom name
  createdAt: timestamp
  isActive: boolean
}
```

#### Caseworkers
Staff members who manage clients within an organization.

```typescript
{
  id: string (UUID)
  orgId: string             // Foreign key to organizations
  email: string
  name: string
  passwordHash: string
  role: string              // 'admin' | 'caseworker' | 'readonly'
  createdAt: timestamp
  isActive: boolean
}
```

#### Users
Individual clients using the app (either free-tier or org-affiliated).

```typescript
{
  id: string (UUID)
  orgId: string?            // Nullable - null for free tier users
  caseworkerId: string?     // Assigned caseworker (org users only)
  pin: string?              // Hashed PIN for simple auth (free tier)
  deviceId: string?         // For PIN collision prevention
  createdAt: timestamp
  isActive: boolean
}
```

### Updated Tables

#### Sessions
Added `userId` and `orgId` for multi-tenancy support.

```typescript
{
  id: string
  userId: string?           // References users.id
  orgId: string?            // References organizations.id (null for free tier)
  location: string
  startTime: timestamp
  endTime: timestamp?
  isTest: boolean
  isActive: boolean
}
```

#### Transactions
Added `userId` and `orgId` for multi-tenancy support.

```typescript
{
  id: string
  sessionId: string         // References sessions.id (with cascade delete)
  userId: string?           // References users.id
  orgId: string?            // References organizations.id (null for free tier)
  timestamp: timestamp
  amount: decimal
  type: string              // 'donation' | 'product'
  productId: string?
  pennies: integer
}
```

## Data Isolation

All queries support organization-level filtering:

```typescript
// Get all sessions for org1 only
await storage.getAllSessions(org1.id);

// Get all sessions for free-tier users
await storage.getAllSessions(null);

// Get ALL sessions (admin only)
await storage.getAllSessions();
```

### Isolation Rules

- **Organization data**: Each org can ONLY access their own users, sessions, and transactions
- **Free-tier data**: Users with `orgId = null` are completely separate from org users
- **Caseworker access**: Caseworkers can only see data for their organization
- **Foreign keys**: Cascade deletes ensure data integrity when orgs/users are removed

## Feature Tiers

### Free Tier
- Individual donation tracking
- Session management
- Goals & analytics
- No organization affiliation
- PIN-based authentication
- Self-service only

### Basic Tier ($500/month)
- Up to 50 clients
- 2 caseworkers
- Basic case management
- Client assignment
- Simple reporting

### Professional Tier ($1,500/month)
- Up to 200 clients
- Unlimited caseworkers
- Custom branding
- Advanced reporting
- HMIS integration ready
- API access

### Enterprise Tier (Custom pricing)
- Unlimited clients
- SSO (SAML)
- Custom integrations
- Dedicated support
- White-label mobile apps
- SLA guarantees

## Feature Flags

Organizations can have specific features enabled via the `features` JSONB field:

```typescript
// Example org with custom features
{
  id: "org-123",
  name: "Downtown Shelter",
  tier: "professional",
  features: {
    caseworkerChat: true,
    appointmentReminders: true,
    courtDateTracking: true,
    medicationReminders: false,
    housingApplications: true,
    harmReductionTracking: false
  }
}
```

## API Design for Multi-Tenancy

### Free Tier Endpoints (existing, backward compatible)

```typescript
// Current endpoints continue to work for free-tier users
GET  /api/session/active
POST /api/session/start
POST /api/session/stop
POST /api/transaction/donation
GET  /api/total?timeframe=today
```

### Organization Endpoints (future)

```typescript
// Caseworker authentication
POST /api/auth/caseworker/login
POST /api/auth/caseworker/logout

// Organization management
GET  /api/org/:orgId
PUT  /api/org/:orgId

// Client management (org-scoped)
GET  /api/org/:orgId/clients
GET  /api/org/:orgId/clients/:userId
POST /api/org/:orgId/clients/:userId/assign-caseworker

// Org-scoped sessions & transactions
GET  /api/org/:orgId/sessions
GET  /api/org/:orgId/transactions
GET  /api/org/:orgId/reports
```

## Migration Path

### Existing Users
Current free-tier users continue to work without changes:
- No `userId` or `orgId` in their sessions/transactions
- Sessions remain accessible via existing endpoints
- Backward compatible

### New Free-Tier Users
Create a `User` record with no org:

```typescript
const user = await storage.createUser({
  pin: hashedPin,
  deviceId: deviceId,
  // orgId: null (default)
});
```

### Organization Users
Create user with org affiliation:

```typescript
const user = await storage.createUser({
  orgId: organizationId,
  caseworkerId: assignedCaseworkerId,
});
```

## Testing

Run the multi-tenancy test suite:

```bash
tsx server/storage.test.ts
```

Tests cover:
- ✓ Organization CRUD operations
- ✓ Caseworker management
- ✓ User creation (free & org)
- ✓ Org-scoped sessions
- ✓ Org-scoped transactions
- ✓ Data isolation between orgs
- ✓ Free-tier vs org-tier separation

## Security Considerations

### Authentication
- **Free tier**: PIN + deviceId hash (simple, no accounts)
- **Org tier**: Email + password for caseworkers, assigned users for clients

### Authorization
- Caseworkers can only access their organization's data
- Admin caseworkers can manage other caseworkers in their org
- Free-tier users have no cross-visibility

### Row-Level Security (Future)
When migrating to PostgreSQL, implement RLS:

```sql
CREATE POLICY org_isolation ON sessions
  FOR ALL TO caseworker_role
  USING (org_id = current_setting('app.org_id')::uuid);
```

## Branding & White-Label

Organizations can customize their instance:

```typescript
{
  branding: {
    logo: "https://cdn.example.com/logo.png",
    primaryColor: "#3B82F6",
    appName: "Downtown Shelter Tracker",
    supportEmail: "help@downtownshelter.org"
  }
}
```

The frontend reads these settings and applies them:
- Custom logo in header
- Theme colors
- App name in titles
- Support contact info

## Next Steps

### Phase 1: Storage Layer ✅
- [x] Add organization, caseworker, user tables
- [x] Add orgId to sessions/transactions
- [x] Implement org-scoped queries
- [x] Write comprehensive tests

### Phase 2: API Layer
- [ ] Add org-scoped API endpoints
- [ ] Implement caseworker authentication
- [ ] Add authorization middleware
- [ ] Update existing endpoints for backward compatibility

### Phase 3: UI Layer
- [ ] Caseworker dashboard
- [ ] Client management UI
- [ ] Organization settings page
- [ ] Branding customization

### Phase 4: Advanced Features
- [ ] In-app chat (caseworker ↔ client)
- [ ] Appointment reminders
- [ ] Reporting dashboard
- [ ] HMIS integration

## Example Usage

### Creating an Organization Deployment

```typescript
// 1. Create organization
const org = await storage.createOrganization({
  name: "Hope House Shelter",
  tier: "professional",
  subdomain: "hopehouse",
  branding: {
    logo: "https://hopehouse.org/logo.png",
    primaryColor: "#10B981",
    appName: "Hope House Client Tracker"
  }
});

// 2. Create admin caseworker
const admin = await storage.createCaseworker({
  orgId: org.id,
  email: "admin@hopehouse.org",
  name: "Jane Admin",
  passwordHash: await hashPassword("secure-password"),
  role: "admin"
});

// 3. Create regular caseworker
const caseworker = await storage.createCaseworker({
  orgId: org.id,
  email: "john@hopehouse.org",
  name: "John Caseworker",
  passwordHash: await hashPassword("another-password"),
  role: "caseworker"
});

// 4. Create client and assign caseworker
const client = await storage.createUser({
  orgId: org.id,
  caseworkerId: caseworker.id
});

// 5. Client creates session
const session = await storage.createSession({
  userId: client.id,
  orgId: org.id,
  location: "Downtown 5th St",
  isTest: false
});

// 6. Record donation
const transaction = await storage.createTransaction({
  sessionId: session.id,
  userId: client.id,
  orgId: org.id,
  amount: "12.50",
  type: "donation"
});

// 7. Caseworker views org data
const orgSessions = await storage.getAllSessions(org.id);
const orgTransactions = await storage.getAllTransactions(org.id);
```

## Backward Compatibility

All existing functionality continues to work:
- Free-tier users create sessions without userId/orgId
- Existing API endpoints work unchanged
- Old data (sessions/transactions without userId/orgId) remains accessible
- No breaking changes to current user experience

The multi-tenancy layer is additive, not disruptive.
