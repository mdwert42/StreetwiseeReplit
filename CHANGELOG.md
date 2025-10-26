# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v0.2.0
- Work types (configurable categories for income tracking)
- Quick donations (record income outside of sessions)
- Work type filtering in totals
- Settings screen

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
