# Manual Testing Guide - Streetwise v0.2.0

This document provides step-by-step manual testing procedures for the v0.2.0 release features.

## Prerequisites

```bash
# Install dependencies
npm install

# Run unit tests
npx tsx server/storage.test.ts

# Start development server
npm run dev
```

## Feature 1: Work Types

### 1.1 Create Work Types

**Steps:**
1. Open the app in browser (usually http://localhost:5000)
2. Click the briefcase icon (top right, below goal button)
3. Click "Add Work Type" button
4. Enter name: "Panhandling"
5. Enter icon: "💰"
6. Click "Add Work Type"
7. Verify work type appears in list with icon

**Expected Result:**
- Work type is created and shown in list
- Success toast appears
- Modal updates without closing

**API Test:**
```bash
# Create a work type via API
curl -X POST http://localhost:5000/api/work-types \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "free-tier",
    "name": "Food Delivery",
    "icon": "🚚",
    "sortOrder": 1
  }'

# Get all work types
curl http://localhost:5000/api/work-types?userId=free-tier
```

### 1.2 Delete Work Types

**Steps:**
1. Open work types modal (briefcase icon)
2. Click trash icon next to a work type
3. Confirm deletion in alert dialog
4. Verify work type is removed from list

**Expected Result:**
- Work type is soft-deleted (isActive=false)
- Removed from displayed list
- Success toast appears

**API Test:**
```bash
# Delete a work type (replace {id} with actual ID)
curl -X DELETE http://localhost:5000/api/work-types/{id}

# Verify it's not returned in active list
curl http://localhost:5000/api/work-types?userId=free-tier
```

### 1.3 Work Type Sorting

**Steps:**
1. Create 3 work types: "C Work" (sortOrder: 2), "A Work" (sortOrder: 0), "B Work" (sortOrder: 1)
2. View work types list in modal or dropdown

**Expected Result:**
- Work types appear in order: A Work, B Work, C Work (sorted by sortOrder)

**Unit Test:**
```bash
# Run storage tests to verify sorting
npx tsx server/storage.test.ts | grep "sorted by sortOrder"
```

### 1.4 Select Work Type in Session

**Steps:**
1. Close work types modal
2. In "Work Type (Optional)" dropdown, select a work type
3. Enter location (e.g., "Downtown Corner")
4. Click "Start Session"
5. Session starts successfully

**Expected Result:**
- Session is created with selected workTypeId
- Session displays normally

**API Verification:**
```bash
# Get active session
curl http://localhost:5000/api/session/active

# Check that workTypeId is set in response
```

## Feature 2: Quick Donations

### 2.1 Record Quick Donation

**Steps:**
1. Make sure no session is active (stop any active session)
2. Click "Quick Donation" button (visible when no session active)
3. Click $5 bill twice (adds 2x $5)
4. Click Quarter once (adds $0.25)
5. In note field, type: "Friend gave me money"
6. Verify total shows: $10.25
7. Click "Done"

**Expected Result:**
- Success toast appears
- Modal closes
- Total on main screen increases by $10.25
- Quick donation is included in totals

**API Test:**
```bash
# Create a quick donation via API
curl -X POST http://localhost:5000/api/transaction/quick-donation \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10.25",
    "pennies": 0,
    "note": "Friend gave me money"
  }'

# Verify it appears in totals
curl http://localhost:5000/api/total?timeframe=all-time
```

### 2.2 Quick Donation with Note

**Steps:**
1. Open Quick Donation modal
2. Add $1 bill
3. In note field, type: "Birthday gift from mom - $20 total but gave change back"
4. Verify character count updates (should show X/200)
5. Click "Done"

**Expected Result:**
- Donation created with note attached
- Note field supports up to 200 characters

**API Verification:**
```bash
# Get all transactions
curl http://localhost:5000/api/total

# Check transaction has note field populated
```

### 2.3 Quick Donation Included in Totals

**Steps:**
1. Note current total
2. Record a quick donation of $5.00
3. Check total on main screen
4. Click total to open breakdown modal
5. Check "Today" total

**Expected Result:**
- Quick donation is included in all totals
- No session required
- Totals update immediately

## Combined Scenarios

### 3.1 Session with Work Type + Donations

**Steps:**
1. Create work type "Street Performance" with icon "🎵"
2. Select "Street Performance" in work type dropdown
3. Enter location "City Park"
4. Start session
5. Record 3 donations: $1, $5, $10
6. Stop session

**Expected Result:**
- Session has workTypeId set
- All donations linked to session
- Session appears in sessions list with work type

### 3.2 Mixed Quick and Session Donations

**Steps:**
1. Record quick donation: $5 (no session)
2. Start session without work type, location "Corner"
3. Record session donation: $10
4. Stop session
5. Record another quick donation: $3
6. Check totals

**Expected Result:**
- Total = $18 ($5 + $10 + $3)
- Both quick donations have null sessionId
- Session donation has sessionId
- All included in totals

## Edge Cases

### 4.1 Empty Work Types List

**Steps:**
1. Delete all work types
2. Open work type dropdown
3. Observe message

**Expected Result:**
- Dropdown shows: "No work types yet. Click the briefcase icon to add some!"
- Can still start session without work type (optional field)

### 4.2 Quick Donation with Zero Amount

**Steps:**
1. Open Quick Donation modal
2. Do not select any denominations
3. Try to click "Done"

**Expected Result:**
- "Done" button is disabled when total = $0
- Cannot submit empty donation

### 4.3 Work Type Isolation

**Steps:**
1. Create work types for userId "free-tier"
2. Query for different userId "test-user"

**Expected Result:**
- Work types are user-specific
- Different users see only their own work types

**API Test:**
```bash
# Create for free-tier
curl -X POST http://localhost:5000/api/work-types \
  -H "Content-Type: application/json" \
  -d '{"userId": "free-tier", "name": "Free Tier Work"}'

# Query for different user - should not return free-tier's work types
curl http://localhost:5000/api/work-types?userId=test-user
```

## Database Migrations

### 5.1 Run Migrations (PostgreSQL)

If using PostgreSQL:

```bash
# Push schema changes to database
npm run db:push

# Verify tables exist
# Connect to your database and run:
# \dt (list tables)
# \d work_types (describe work_types table)
```

### 5.2 Verify Schema

Check that the following exist:
- `work_types` table with columns: id, userId, orgId, name, icon, color, isDefault, sortOrder, isActive, createdAt
- `sessions` table has `work_type_id` column
- `transactions` table has nullable `session_id`, `work_type_id`, and `note` columns

## Performance Testing

### 6.1 Many Work Types

**Steps:**
1. Create 20+ work types via API
2. Open work types modal
3. Open work type dropdown

**Expected Result:**
- List loads quickly
- Dropdown is scrollable
- No performance degradation

### 6.2 Quick Donation Responsiveness

**Steps:**
1. Open Quick Donation modal
2. Rapidly click denominations (10+ clicks)
3. Counts update smoothly

**Expected Result:**
- UI remains responsive
- Counts update in real-time
- No lag or freezing

## Cleanup

```bash
# Stop development server
# Ctrl+C in terminal

# Run unit tests one more time to ensure nothing broke
npx tsx server/storage.test.ts

# Check git status
git status

# Build for production (optional)
npm run build
```

## Success Criteria

v0.2.0 is ready for release when:
- ✅ All unit tests pass (25+ passing tests)
- ✅ Work types can be created, listed, and deleted via UI
- ✅ Work types can be selected when starting sessions
- ✅ Quick donations work without sessions
- ✅ Quick donations include optional note field
- ✅ All totals include quick donations
- ✅ No console errors in browser or server
- ✅ Build completes successfully
