# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-01-26

### Added
- **Work Types Feature**
  - Configurable work type categories (e.g., "Panhandling", "Food Delivery", "Street Performance")
  - Work types management modal with add/delete functionality
  - Optional emoji icons for work types
  - Custom sorting order support
  - User-specific work types (isolated by userId/orgId)
  - Work type selector dropdown in session start flow
  - Work type tagging for sessions

- **Quick Donations Feature**
  - Record donations without starting a session
  - Quick donation button on main screen (when no session active)
  - Quick donation modal with denomination selection
  - Optional note field (200 char limit) for context
  - Quick donations included in all totals
  - Dedicated API endpoint for quick donations

- **API Enhancements**
  - GET /api/work-types - Fetch work types by userId/orgId
  - POST /api/work-types - Create new work type
  - PUT /api/work-types/:id - Update work type
  - DELETE /api/work-types/:id - Soft delete work type
  - POST /api/transaction/quick-donation - Record donation without session

- **Schema Updates**
  - work_types table with icon, color, sortOrder, isActive
  - sessions.work_type_id for categorizing sessions
  - transactions.session_id now nullable (for quick donations)
  - transactions.work_type_id for denormalized filtering
  - transactions.note field for optional context

- **Testing & Documentation**
  - 10 new unit tests for work types (25+ total passing tests)
  - Comprehensive TESTING.md with manual test procedures
  - API testing examples with curl commands
  - Edge case testing scenarios

### Changed
- Totals calculation updated to include quick donations (null sessionId)
- Session creation now accepts optional workTypeId
- Donation endpoint supports nullable sessionId

### Technical
- Work type CRUD in both MemStorage and DbStorage
- Soft delete implementation for work types (isActive flag)
- Work types sorted by sortOrder in all queries
- User/org isolation for work types
- React Query integration for work types
- Select component for work type dropdown

## [0.1.0] - 2025-01-26

### Added
- Core donation tracking system
- Session management (start/stop/location)
- Test session mode (exclude from totals)
- Multi-tenancy architecture for white-label deployments
  - Organizations table
  - Caseworkers table
  - Users table
  - Org-scoped data isolation
- PostgreSQL database support via Drizzle ORM
- Automatic fallback to in-memory storage
- Donation recording with bill/coin denominations
- Penny counter with quick entry mode
- Multiple timeframe views (today/week/month/all-time)
- Daily goal setting and tracking
- Total breakdown modal
- CI/CD pipeline with GitHub Actions
- Deployment scripts for GCP
- Comprehensive documentation
  - DATABASE_SETUP.md
  - INFRASTRUCTURE.md
  - MULTI_TENANCY.md
  - DEPLOYMENT.md

### Technical
- React 18 + TypeScript frontend
- Express.js backend
- Drizzle ORM + Neon PostgreSQL
- Radix UI + Tailwind CSS
- React Query for state management
- PM2 process management
- Vite build system
- Node 18+ compatibility

### Infrastructure
- GCP Compute Engine deployment ready
- Neon PostgreSQL free tier support
- GitHub Actions CI/CD
- PM2 deployment scripts
- Nginx reverse proxy configuration
- SSL/HTTPS setup guide

### Documentation
- Database setup guide
- Infrastructure deployment guide
- Multi-tenancy architecture docs
- API documentation (inline)
- Testing guide
- Troubleshooting guides

## [0.0.0] - Initial Development

### Added
- Project scaffolding
- Basic Express server
- React client setup
- Database schema design

---

## Version Format

**MAJOR.MINOR.PATCH**

- **MAJOR**: Breaking changes (once v1.0.0+)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Pre-1.0 Note

While in v0.x.x, breaking changes may occur in MINOR versions.
Version v1.0.0 will be the first production-ready release.

## Links

- [Repository](https://github.com/mdwert42/StreetwiseeReplit)
- [Issues](https://github.com/mdwert42/StreetwiseeReplit/issues)
- [Releases](https://github.com/mdwert42/StreetwiseeReplit/releases)
