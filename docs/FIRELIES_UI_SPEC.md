# Fireflies UI/UX Specification

**Project:** Fireflies.ai-inspired Meeting Intelligence Platform (Clone / SDE Assignment)
**Document type:** UI/UX Specification — Phase 0
**Status:** Final v1.0
**Scope:** Authenticated application IA, layout, interaction design, visual language, component decomposition for the clone.

> No Fireflies assets, branding, copy, icons, or source code are copied. All visuals, copy, palette, and component implementations are original.

> **Implementation status (Phase 16):** This document describes the design intent. The implementation matches the locked decisions (rail expansion behavior, two-pane Notepad, persistent right rail, inline timestamp links, etc.). Visual tokens were refined in Phase 12 (Visual Polish) and the responsive behavior described in §7 was implemented in Phase 13 (Responsive Design). Treat this document as the source of design intent; the canonical current state lives in the codebase + the project README.

---

## 1. Product Surfaces Covered

Authenticated in-app routes we will build:

| Route | Surface | Status |
|---|---|---|
| `/` | Home / Dashboard | Real |
| `/meetings` | Meetings Library (channels + list) | Real |
| `/meetings/:id` | Notepad (meeting detail) | Real |
| `/settings` | Settings | Placeholder |
| `/coming-soon` | Placeholder route for rail items that are visual-only | Placeholder |

Rail destinations we render as visual placeholders (no real page): Tasks, AI Skills, Analytics, Voice Agents, Upgrade, Try Email Assistant, Integrations.

---

## 2. Information Architecture

```
/ (Dashboard)
├── Promo banner (dismissible)
├── Greeting header
├── "Personal Assistant" feature cards (3, empty-state captions)
├── Free-tier banner (visual)
├── Tabs: Recent | Upcoming | AI Feed
├── Meetings feed (Recent tab is real; Upcoming/AI Feed show empty states)
└── "Try More" decorative section

/meetings
├── Promo banner
├── TopBar
├── Secondary panel: Channels (# My Meetings / All Meetings / Voice Agent Meetings / Uploads) + "All channels" empty state
├── Main column:
│   ├── Page header "Meetings"
│   ├── Toolbar: Hosted by me / Shared with me / Filters / search icon
│   ├── Section "Today" + Feedback link
│   ├── Meeting cards (My Meetings, All Meetings)
│   ├── Channel-specific empty states (Voice Agent Meetings, Uploads)
│   └── "You've reached the end of your meetings." end state
└── Right rail: AskFred | Transcript (panel mode; channel-context prompts)

/meetings/:id (Notepad)
├── Promo banner
├── Breadcrumb top header (channel / meeting title, share, etc.)
├── Context panel (slide-in): Smart Search + AI FILTERS / SENTIMENTS / SPEAKER TALKTIME / TOPIC TRACKERS accordions (visual)
├── Center column:
│   ├── Notes / AI Skills tabs (Notes active)
│   ├── Meeting title + meta row
│   ├── Summary controls (General Summary dropdown, Refine, copy, Edit)
│   ├── Sectioned Notes (sub-bullets + inline `(mm:ss)` timestamp links)
│   └── Action items section (CRUD)
├── Sticky bottom media bar (full width)
└── Right rail: AskFred | Transcript tabs (Transcript tab shows speaker-labeled transcript + active-segment sync)

/settings            → placeholder page
/coming-soon         → placeholder page
```

---

## 3. App Shell

### 3.1 Top promo banner
- Light purple bg `#EEF0FF`, text "You are eligible for 7 days business plan free trial." + link "Start free trial →" + close `×`.
- Dismissed state persisted in `localStorage`.
- Non-clickable (Upgrade link is a no-op toast).

### 3.2 Left rail
- **Collapsed by default**, 64 px wide, icon-only with tooltip on hover.
- **Expands to ~200 px** on hover or when any item is active.
- Top: workspace avatar + name + dropdown caret (placeholder menu; click → no-op toast).
- Middle: rail items (visual order matches screenshots): Home, AskFred, Meetings, Tasks, AI Skills, Analytics, Voice Agents, Upgrade (with `40% OFF` green pill — visual), Try Email Assistant (highlighted chip), Integrations, Settings.
- Only **Home, AskFred, Meetings, Settings** navigate to real routes. Others route to `/coming-soon` (which renders a "Coming soon" placeholder).
- Bottom: persistent upsell card "Invite coworkers to your Fireflies team" + `Create Team` button (visual, no-op toast).

### 3.3 Top bar (header)
- Hidden when rail is collapsed at narrow widths.
- Centered global search input with `⌘K` shortcut hint.
- Right side: `0 Free meetings` counter chip (decorative, derived from mock state), `Upgrade` pill (visual), bell icon (no-op), `Capture` purple primary CTA (no-op toast).

### 3.4 Right rail
- Persistent ~360 px panel on `lg+`. Hidden below `lg`; replaced by a slide-over sheet on `md`.
- Tabs: `AskFred | Transcript`.
- **AskFred tab**: greeting "Hi Naresh! Get ready for your meeting", 3 channel-context prompt chips (rotate per selected channel), composer with `#<channel>` chip prefix + `+` attach + `◆` layers + mic + send (send → no-op toast).
- **Transcript tab** (Notepad only): speaker-labeled transcript with clickable timestamps. Active segment is highlighted in sync with the bottom media bar.
- Page-mode toggle: clicking the `AskFred` rail icon opens the full-page AskFred experience and hides the right rail.

### 3.5 Floating help FAB
- Bottom-right purple circular `?` button.
- Click → small popover "Demo mode — help is not available".

---

## 4. Home / Dashboard

| Region | Content |
|---|---|
| Greeting | "Good {Morning/Afternoon/Evening}, Naresh {emoji}" + `Feedback` link |
| Personal Assistant row | 3 cards: Daily Brief (`No brief yet`), Meeting Prep (`No upcoming meetings`), Tasks (`0 New tasks`) — visual, non-functional |
| Free-tier banner | "0 free meetings left — No summary notes for new meetings." + Upgrade link |
| Tabs | `Recent` (real, lists meetings), `Upcoming` (empty state), `AI Feed` (empty state "AI Feed is not available in this demo") |
| Settings link | Right side of tab row → `/settings` |
| Meetings feed | One card per meeting; clickable → Notepad |
| "Try More" | 3 decorative upsell cards ("Channels", "Integrations", "AskFred") with disabled "Try" CTAs |
| Right rail | AskFred tab pre-populated with prompts |

---

## 5. Meetings Library

- Secondary panel pushes main content right; rail stays visible.
- Channels: `# My Meetings` (active default), `📅 All Meetings`, `🤖 Voice Agent Meetings`, `⬆ Uploads`. Each is a UI-side filter on the meetings list.
- "All channels" section below with empty state and `+ Channel` button (no-op toast).
- Toolbar: `Hosted by me / Shared with me` toggles, `Filters` button (opens filter modal), `🔍` search icon (opens search bar inline).
- Section header `☐ Today` with bulk-select checkbox + `Feedback` link.
- Meeting card: avatar, title (1 line), chevron `›`, monitor icon, meta line `Sep 7 · 1:25 PM · 5 min · Naresh`. Selected/hover state shows blue ring + elevation.
- Per-channel empty states:
  - `# My Meetings`: list of meetings.
  - `All Meetings`: same list.
  - `Voice Agent Meetings`: skeleton illustration + "Let a voice agent take your meetings" + `+ Create` (no-op).
  - `Uploads`: skeleton illustration + "Upload audio or video recordings" + "Up to 100 MB for video and 500 MB for audio. Supports MP3, M4A, WAV, MP4, WEBM." + full-width `+ Upload Meeting` button (no-op).
- "You've reached the end of your meetings." end-of-list message (My/All).

---

## 6. Notepad (Meeting Detail)

- **Breadcrumb top header** (full width): collapse-rail toggle | `#<channel> / <meeting title>` + `⋯` | Upgrade | Slack chip (visual) | `1 View` (visual) | `Share` (no-op) | `+` (no-op) | bell | avatar.
- **Left context panel** (slide-in or persistent on `lg+`): Smart Search input (placeholder), accordions for `AI FILTERS`, `SENTIMENTS`, `SPEAKER TALKTIME`, `TOPIC TRACKERS` (visual placeholders, collapsed by default), bookmark icon.
- **Center column** (`Notes / AI Skills · 0` tabs; AI Skills empty state):
  - Meeting title + meta row: avatar + host name (link), date · time · monitor icon, language dropdown (visual 3 options), Video button (disabled with tooltip "Video not available in this demo").
  - Summary controls row: `✨ General Summary ▾` (dropdown shows only "General Summary" in v1), `✦ Refine Summary` (no-op toast), copy icon (copies summary to clipboard → toast), Edit (toggles edit mode; in v1 edit mode is read-only with toast "Inline editing is not available in this demo").
  - Notes body (the sectioned summary): H2 sections (Notes / App Overview / User Interface), H3 sub-sections, bullets and nested sub-bullets, inline clickable `(mm:ss)` timestamp links in blue/purple that jump the player.
  - Action Items section: checkbox, title (editable), assignee, due date, delete. New item input below.
- **Sticky bottom media bar** (full width, pinned to viewport bottom on Notepad only):
  - Left: `00:00 / 00:00` time, `1×` speed menu (0.5/0.75/1/1.25/1.5/2), `↶` undo (no-op), big purple `▶` play, `↷` redo (no-op), `⬇` download (downloads summary `.md` → toast).
  - Right: `☆` bookmark (persisted per meeting), `☑` checkbox (no-op), `👍` / `👎` feedback (no-op).
- **Right rail**: `AskFred | Transcript` tabs. Transcript tab shows speaker-labeled transcript with clickable timestamps and the active-segment highlight.

---

## 7. Transcript ↔ Player Synchronization

- Bottom media bar is the single source of truth for playback state.
- Transcript list (in right-rail Transcript tab) listens to a `MediaSyncContext`.
- **Transcript → Player**: clicking a segment calls `player.currentTime = segment.startTime` and `player.play()`.
- **Player → Transcript**: throttled `timeupdate` (~16 ms via rAF) computes `activeSegmentId` by binary-searching `[start, end]`. Active segment receives:
  - Soft background highlight + left accent bar.
  - Auto-scroll into view when follow-mode is on.
- **Search inside transcript**: matches highlighted; prev/next controls seek + jump.
- Keyboard: `Space` play/pause; `←/→` seek ±5 s; `J/L` prev/next segment; `/` focus search.

---

## 8. Search & Filters

- **Library search**: case-insensitive substring on title + participants + (optionally) transcript. Debounced 200 ms.
- **Library filters** (modal/drawer): Hosted by me, Shared with me, Date range, Duration, Capture source.
- **Library sort**: Recent (default), Oldest, Longest, Shortest, Title A→Z.
- **Transcript search**: matches highlighted; prev/next (`↑/↓` keys).
- **Global search**: `⌘K` opens a header overlay showing matching meetings + transcript snippets with timestamps (v1 minimal).

---

## 9. Action Items & Bookmarks

- Action items live inside the meeting Notes panel, not as a global Tasks page.
- Full CRUD: create, edit (inline title), complete (checkbox), delete.
- Bookmark toggled from bottom media bar persists per meeting; library has a `Bookmarked` filter chip.

---

## 10. Component Hierarchy

### 10.1 Primitives (`components/ui/`)
`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Dropdown`, `Modal`, `Tooltip`, `Toast`, `Tabs`, `Badge`, `Avatar`, `AvatarStack`, `Chip`, `Checkbox`, `Switch`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, `Popover`.

### 10.2 Domain (`features/...`)

- `features/shell/`: `PromoBanner`, `IconRail`, `ExpandableRail`, `TopBar`, `SecondaryPanel`, `PersistentRightRail`, `HelpFab`, `GreetingHeader`.
- `features/home/`: `PersonalAssistantRow`, `FeatureCard`, `FreeTierBanner`, `DashboardTabs`, `MeetingsFeed`, `TryMore`.
- `features/meetings/`: `MeetingsLibrary`, `ChannelsList`, `ChannelEmptyState`, `MeetingList`, `MeetingCard`, `LibraryToolbar`, `FilterModal`.
- `features/meeting-detail/`: `Notepad`, `BreadcrumbHeader`, `ContextPanel`, `NotepadNotesPanel`, `NotesSection`, `TimestampLink`, `ActionItemsPanel`, `ActionItemRow`, `StickyMediaBar`.
- `features/transcript/`: `TranscriptPanel`, `TranscriptSegment`, `TranscriptSearch`, `TranscriptNav`, `useMediaSync`, `useTranscriptSearch`.
- `features/askfred/`: `AskFredPanel`, `AskFredPage`, `PromptChip`, `AskFredComposer`.

### 10.3 Hooks

`useMeetings`, `useMeeting`, `useMediaSync`, `useTranscriptSearch`, `useToast`, `useDismissableBanner`.

---

## 11. Design Tokens

### 11.1 Color (light theme)

| Token | Value | Use |
|---|---|---|
| `bg/canvas` | `#FAFAFA` | App background |
| `bg/surface` | `#FFFFFF` | Cards, panels |
| `bg/surface-2` | `#F4F4F5` | Subtle panels (filter row, hover) |
| `text/primary` | `#0B0B0F` | Default text |
| `text/secondary` | `#52525B` | Meta, captions |
| `text/muted` | `#A1A1AA` | Disabled, placeholders |
| `border/subtle` | `#E4E4E7` | Default borders |
| `border/strong` | `#D4D4D8` | Emphasized borders |
| `accent/primary` | `#5B4DF5` | Primary action, active states, links, play button |
| `accent/primary-hover` | `#4840D6` | Hover |
| `accent/secondary` | `#8B5CF6` | Highlights, gradients |
| `success` | `#16A34A` | Completed action item |
| `warning` | `#D97706` | Validation warnings |
| `danger` | `#DC2626` | Destructive actions |
| `highlight/bg` | `#FEF3C7` | Transcript search match |
| `active-segment/bg` | `#EEF2FF` | Active transcript row |
| `promo/bg` | `#EEF0FF` | Top promo banner |
| `free-tier/bg` | `#FEF3C7` | Free-tier warning |

Speaker palette (8 colors, cycle by speaker order):

`#5B4DF5 #14B8A6 #F59E0B #EC4899 #0EA5E9 #84CC16 #A855F7 #EF4444`

### 11.2 Typography

- Primary font: Inter (with system fallback).
- Mono (timestamps): `ui-monospace, "SF Mono", Menlo, monospace`.

| Role | Size / Weight | Line-height |
|---|---|---|
| display/lg | 32 / 700 | 40 |
| display/md | 24 / 600 | 32 |
| title/lg | 20 / 600 | 28 |
| title/md | 16 / 600 | 24 |
| body/lg | 16 / 400 | 24 |
| body/md | 14 / 400 | 20 |
| body/sm | 13 / 400 | 18 |
| label/md | 13 / 500 | 16 |
| label/sm | 12 / 500 | 16 |
| mono/sm | 13 / 500 | 18 |

### 11.3 Spacing

`space-1=4`, `space-2=8`, `space-3=12`, `space-4=16`, `space-5=20`, `space-6=24`, `space-8=32`, `space-10=40`, `space-12=48`, `space-16=64`.

### 11.4 Radii

`sm=6`, `md=8`, `lg=12`, `xl=16`, `pill=999`.

### 11.5 Shadows

`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-pop`.

### 11.6 Motion

- Default: `150ms ease-out` (hover), `200ms ease-in-out` (panel), `250ms cubic-bezier(.2,.8,.2,1)` (transcript).
- Respect `prefers-reduced-motion`.

---

## 12. Responsive Behavior

- `xl+`: rail + secondary panel + main + right rail all visible. Sticky bottom bar.
- `lg`: rail auto-collapses on inactivity; right rail persists.
- `md`: rail becomes a hamburger drawer; right rail becomes a slide-over; Notepad stacks vertically (Notes → Transcript); sticky bottom bar persists.
- `<md`: rail hidden behind hamburger; right rail hidden (Transcript accessible via tab on bottom bar); Notepad stacks; sticky bottom bar persists.

---

## 13. Interaction States

Default / Hover / Focus / Active / Selected / Disabled / Loading / Error / Empty / Success / Confirmation — same matrix across the app, with `focus-visible` ring using `accent/primary` at 2 px offset.

| State | Behavior |
|---|---|
| Default | Defined visual |
| Hover | Subtle bg shift (`bg/surface-2`) or border highlight |
| Focus | 2px outline ring in `accent/primary` with 2px offset |
| Active / Pressed | Slight darken + scale to 0.98 |
| Selected | `accent/primary` left border or background tint |
| Disabled | 50% opacity, `cursor: not-allowed`, no hover |
| Loading | Skeleton placeholder or spinner; preserves layout |
| Error | Red border + helper text |
| Empty | Centered illustration + title + description + CTA |
| Success | Toast (auto-dismiss 4s) |
| Confirmation (destructive) | Modal with explicit confirmation button |

---

## 14. Accessibility

- Keyboard reachable; focus ring; Esc closes modals; Arrow keys navigate transcript and search results.
- Transcript has `aria-live="polite"` for active segment.
- Bottom bar media buttons labeled.
- Rail icons have tooltips (`aria-label` + `title`).
- AA contrast minimum.

---

## 15. PATTERNS TO REPLICATE vs ORIGINAL IMPLEMENTATION

### Replicate (interaction conventions only)

- Collapsed-by-default icon-only rail that expands on hover.
- Secondary channel panel as push navigation.
- Breadcrumb-style top header inside Notepad.
- Sectioned summary with inline `(mm:ss)` timestamp links.
- Sticky bottom media bar.
- Persistent right rail with `AskFred | Transcript` tabs.
- Channel-context prompt chips in AskFred.
- Topic/Sentiment/Speaker Talktime accordions as visual placeholders.

### Original implementation (no copying)

- All branding, copy, icons, colors outside the purple accent.
- Promo banner copy, upsell cards, empty-state copy (all written by us).
- All component implementations.
- All proprietary Fireflies assets.

---

## 16. Open Questions Resolved (Decision Log)

| Decision | Choice |
|---|---|
| Rail width behavior | Collapsed-by-default icon-only, expands on hover/active |
| Rail scope | All items rendered as visual placeholders; only Home, AskFred, Meetings, Settings are real routes |
| Right rail presence | Persistent panel + AskFred full-page toggle |
| Dashboard tabs | All three (Recent / Upcoming / AI Feed) rendered with empty states |
| Theme | Fully light with purple/violet accent `#5B4DF5` |
| Transcript location | Right-rail Transcript tab |
| Media player | Sticky bottom bar |
| Dashboard scope | Full dashboard with PA cards and Try More |
| Audio source | Bundled placeholder MP3 reused; `media_url` column preserved per meeting |
| Auth | Mocked single default user (Naresh); no real auth |