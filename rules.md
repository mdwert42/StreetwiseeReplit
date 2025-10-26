# Development Rules & Guidelines

This document contains rules and best practices for developing Streetwise.

## Semantic Versioning

Streetwise follows [Semantic Versioning 2.0.0](https://semver.org/).

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (v1.0.0, v2.0.0): Breaking changes, incompatible API changes
- **MINOR** (v0.1.0, v0.2.0): New features, backward compatible
- **PATCH** (v0.1.1, v0.1.2): Bug fixes, backward compatible

### Version Update Rules

**MUST update version when:**
- Adding new features → increment MINOR
- Fixing bugs → increment PATCH
- Breaking changes → increment MAJOR (once past v1.0.0)

**Version update locations:**
1. `package.json` - `version` field
2. Git tag - `git tag vX.Y.Z`
3. GitHub release (when applicable)

### Pre-1.0 Versioning

While in v0.x.x (pre-release):
- **v0.MINOR.PATCH** - MINOR = features, PATCH = fixes
- Breaking changes are allowed in MINOR versions
- v1.0.0 = first production-ready release

### Current Version

**v0.1.0** - Initial working version with:
- Session management
- Donation tracking
- Multi-tenancy support
- PostgreSQL database
- GCP deployment

### Version History

| Version | Date | Description |
|---------|------|-------------|
| v0.1.0 | 2025-01 | Initial release with core features |
| v0.2.0 | (next) | Work types + quick donations |

## Branching Strategy

### Branch Types

**main**
- Production-ready code
- Always deployable
- Protected branch
- Requires PR review (future)

**feature/[name]**
- New features
- Branch from: `main`
- Merge to: `main` via PR
- Example: `feature/work-types`, `feature/analytics`

**fix/[name]**
- Bug fixes
- Branch from: `main`
- Merge to: `main` via PR
- Example: `fix/session-crash`, `fix/date-formatting`

**hotfix/[name]**
- Critical production fixes
- Branch from: `main`
- Merge to: `main` immediately
- Example: `hotfix/security-patch`

**claude/[session-id]**
- Temporary Claude Code session branches
- Merge to `main` when work is complete
- Delete after merge

### Workflow

1. **Start new feature:**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/feature-name
   ```

2. **Work on feature:**
   ```bash
   # Make commits
   git add .
   git commit -m "feat: description"
   ```

3. **Ready to merge:**
   ```bash
   # Update version in package.json
   # Update CHANGELOG.md
   git checkout main
   git merge feature/feature-name
   git tag v0.X.0
   git push origin main --tags
   ```

4. **Clean up:**
   ```bash
   git branch -d feature/feature-name
   ```

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code restructuring (no feature/fix)
- `perf:` - Performance improvement
- `test:` - Adding/updating tests
- `chore:` - Maintenance (deps, build, etc)
- `ci:` - CI/CD changes

### Examples

```bash
# Feature
git commit -m "feat(sessions): add work type selection"

# Bug fix
git commit -m "fix(auth): handle expired tokens correctly"

# Breaking change
git commit -m "feat(api)!: change session endpoint structure

BREAKING CHANGE: /api/session/active now returns different format"
```

## Testing Requirements

### Unit Tests

**MUST write unit tests for:**
- Storage layer (database operations)
- API endpoints (critical paths)
- Business logic (calculations, validations)
- Utility functions

**Test file naming:**
- `*.test.ts` - Unit tests
- `*.spec.ts` - Integration tests

**Test coverage targets:**
- Critical paths: 100%
- Storage layer: >90%
- API layer: >80%
- Overall: >70%

### Manual Testing

**MUST document manual tests in:**
- `docs/manual-testing/[feature-name].md`
- Include all curl commands, expected outputs
- Screenshot UI interactions

**Before merging:**
- [ ] All unit tests pass (`npm test`)
- [ ] Manual testing documented
- [ ] Tested on development environment
- [ ] Tested on staging/production (if applicable)

## Documentation Requirements

### Code Documentation

**MUST document:**
- Complex functions (JSDoc comments)
- API endpoints (inline comments)
- Database schema changes (migration notes)
- Configuration options

**Example:**
```typescript
/**
 * Creates a quick donation without an active session
 * @param amount - Donation amount in dollars
 * @param note - Optional note about the donation
 * @param workTypeId - Optional work type classification
 * @returns Created transaction record
 */
async function createQuickDonation(...)
```

### Project Documentation

**MUST update when changing:**
- `README.md` - High-level overview
- `DATABASE_SETUP.md` - Schema changes
- `INFRASTRUCTURE.md` - Deployment changes
- `MULTI_TENANCY.md` - Multi-tenancy logic
- `CHANGELOG.md` - Version history

## Code Quality Standards

### TypeScript

- **Strict mode enabled** - No `any` types without reason
- **Type safety** - Explicit types for public APIs
- **No unused imports** - Clean imports
- **Consistent formatting** - Use project prettier/eslint

### Database

- **Migrations required** - Never alter schema directly
- **Foreign keys** - Always use references
- **Indexes** - Add for frequently queried fields
- **Nullable fields** - Explicit when allowing null

### Security

- **No secrets in code** - Use environment variables
- **Input validation** - Validate all user input
- **SQL injection protection** - Use parameterized queries
- **XSS prevention** - Sanitize output

## Release Process

### Pre-release Checklist

- [ ] All tests passing
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Migration guide (if schema changes)
- [ ] Tested on production-like environment

### Release Steps

1. Update version: `npm version [major|minor|patch]`
2. Update CHANGELOG.md
3. Commit: `git commit -am "chore: release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push origin main --tags`
6. Deploy to production
7. Create GitHub release (optional)

### Post-release

- Monitor logs for errors
- Check database migrations succeeded
- Verify all features working
- Update deployment docs if needed

## Dependencies Management

### Adding Dependencies

**Before adding a dependency:**
- [ ] Is it actively maintained?
- [ ] Does it have good TypeScript support?
- [ ] Is the license compatible (MIT/Apache)?
- [ ] Can we use a smaller alternative?

**Add to correct section:**
- `dependencies` - Runtime requirements
- `devDependencies` - Build/test only
- `optionalDependencies` - Nice-to-have

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all (carefully!)
npm update

# Test after updates
npm test && npm run build
```

## Performance Guidelines

### Database Queries

- **Avoid N+1 queries** - Use joins or batch queries
- **Limit results** - Always paginate large datasets
- **Index lookups** - Query by indexed fields
- **Connection pooling** - Reuse database connections

### Frontend

- **Lazy loading** - Load routes on demand
- **Debounce inputs** - Reduce API calls
- **Optimize images** - Compress and resize
- **Cache static assets** - Use CDN when possible

## Monitoring & Logging

### Logging Levels

- `error` - System errors, exceptions
- `warn` - Warnings, deprecated usage
- `info` - Important business events
- `debug` - Detailed debugging (dev only)

### What to Log

**DO log:**
- API requests (method, path, status)
- Database operations (queries, timing)
- Authentication events
- Errors with stack traces

**DON'T log:**
- Passwords or secrets
- Personal information (unless necessary)
- Excessive debug in production

## Emergency Procedures

### Production Incident

1. **Assess severity** - Is app down? Data loss?
2. **Communicate** - Notify users if needed
3. **Rollback** - Revert to last working version
4. **Fix** - Create hotfix branch
5. **Test** - Verify fix in staging
6. **Deploy** - Fast-track to production
7. **Postmortem** - Document what happened

### Database Issues

```bash
# Backup before fixing
pg_dump $DATABASE_URL > emergency-backup.sql

# Test fix on copy
# Apply fix
# Verify data integrity
```

## Questions?

When in doubt:
1. Check this document
2. Review similar code in the codebase
3. Ask for clarification
4. Document your decision

---

**Last updated:** 2025-01-26
**Version:** 1.0
