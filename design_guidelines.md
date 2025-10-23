# Design Guidelines: Donation Tracking App

## Design Approach

**Selected Approach:** Design System - Utility-First Mobile Application

**Justification:** This is a field-use utility app where speed, clarity, and reliability are paramount. The design prioritizes quick data entry, clear information hierarchy, and mobile-first optimization. Drawing inspiration from productivity tools like Linear and Notion for clean interfaces with efficient interactions.

**Key Design Principles:**
- Mobile-first with thumb-friendly touch targets
- Instant visual feedback for all interactions
- Clear information hierarchy for at-a-glance data
- Zero cognitive load - every action should be obvious
- Efficiency over decoration

## Typography

**Font Stack:** Inter (via Google Fonts CDN)
- **Display/Headers:** Font weight 700, tracking tight
- **Primary Numbers (totals):** Font weight 600, size text-4xl to text-6xl
- **Button Labels:** Font weight 600, size text-base
- **Body/Labels:** Font weight 400-500, size text-sm to text-base
- **Meta Info (timestamps):** Font weight 400, size text-xs, opacity reduced

## Layout System

**Spacing Units:** Tailwind units of 3, 4, 6, and 8 for consistency
- Component padding: p-4 to p-6
- Button spacing: gap-3 to gap-4
- Section margins: my-6 to my-8
- Screen padding: px-4 to px-6

**Container Structure:**
- Full viewport height utilization with safe-area-inset support
- Max-width constraint of max-w-md for optimal mobile reading
- Centered content with mx-auto on larger screens

## Component Library

### Core Dashboard

**Total Display Card:**
- Large, prominent card at top of screen
- Number displayed at text-5xl to text-6xl scale
- Label "Total Collected" at text-sm above number
- Subtle border with rounded-xl corners
- Padding p-6 to p-8

**Session Controls Section:**
- Start/Stop button as primary action button (full-width on mobile)
- Location input field: text-base, p-3, rounded-lg, full-width
- Test session toggle: Clean checkbox with label, subtle styling
- Grouped with gap-4 spacing

### Button System

**Primary Action Buttons (Start/Stop, Record Donation):**
- Height h-12 to h-14 for easy thumb access
- Full-width on mobile (w-full)
- Font weight 600, text-base
- Rounded-lg corners
- Active/pressed state with scale-95 transform

**Denomination Grid Buttons:**
- Arranged in responsive grid: grid-cols-3 gap-3
- Square or near-square aspect ratio (h-16 to h-20)
- Large, clear labels (text-lg to text-xl for amounts)
- Rounded-lg corners
- Tap counter badge overlaid in top-right corner (absolute positioning)

**Product Buttons:**
- Distinct from donation buttons
- Width w-full, arranged in single column
- Height h-12, with clear product label + amount
- Rounded-lg borders to differentiate from cash denominations

### Modal Design

**Donation Recording Modal:**
- Slides up from bottom on mobile (bottom sheet pattern)
- Full-width on small screens, max-w-lg centered on larger screens
- Header with "Record Donation" title (text-lg, font-semibold) and close button
- Content area with p-6 padding
- Fixed footer with "Done" button (sticky positioning)

**Denomination Layout in Modal:**
- Bills section ($1, $5, $10): grid-cols-3, gap-3
- Coins section: Quarters/Dimes/Nickels in grid-cols-3, gap-2 (slightly smaller buttons h-14)
- Pennies button: Full-width, separate from other coins, subtle styling
- Running subtotal displayed prominently above "Done" button

### Data Display

**Session History (for future implementation):**
- List items with clear separation (border-b)
- Each item shows: timestamp, amount, location
- Compact spacing (py-3, px-4)
- Test sessions: distinct visual treatment (opacity-60 or strikethrough)

## Navigation & Structure

**Single-Screen Layout:**
- Fixed header with app title (optional, can be omitted for max space)
- Scrollable content area
- No complex navigation needed - everything on one screen

**Information Hierarchy:**
1. Total collected (largest, most prominent)
2. Session controls (Start/Stop, Location)
3. Action buttons (Record Donation, Products)
4. Session history (below fold, secondary)

## Interaction Patterns

**Tap Feedback:**
- All buttons use active:scale-95 for tactile feedback
- Counter badges increment with micro-bounce (if using minimal animation)
- No hover states needed (mobile-first)

**Form Interactions:**
- Text inputs with clear focus states (ring)
- Checkbox/toggle with immediate visual confirmation
- Auto-focus on modal open for quick entry

**Modal Behavior:**
- Opens with slide-up animation (if any animation used)
- Backdrop click/swipe to dismiss
- "Done" button prominent and always visible

## Accessibility

- Minimum touch target size: 44x44px (h-11 minimum)
- Clear labels for all interactive elements
- Semantic HTML structure (button, form, input elements)
- Proper heading hierarchy (h1 for main total, h2 for sections)
- Sufficient contrast ratios for all text
- Form inputs with associated labels

## Responsive Behavior

**Mobile (< 768px):**
- Full-width buttons
- Single column layouts
- Bottom sheet modals
- Padding px-4

**Tablet/Desktop (≥ 768px):**
- Centered container with max-w-md
- Modal as centered overlay with max-w-lg
- Slightly increased padding px-6

## Asset Requirements

**Icons:** Use Heroicons (via CDN) for:
- Plus icon for "Record Donation"
- Play/Stop icons for session controls
- X/Close icon for modal
- Location pin icon (optional for location field)
- Check icon for test session toggle

**No Images Required:** This is a pure utility interface with no decorative imagery needed.