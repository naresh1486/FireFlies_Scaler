"""Realistic seed meeting definitions used by `seed.py`.

Each entry maps to the database schema described in docs/DATABASE.md.
Times are expressed as integer seconds relative to the meeting start
(noon on the meeting's date).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal


Channel = Literal["my", "all", "voice", "uploads"]
CaptureSource = Literal["upload", "mic", "bot", "desktop", "browser"]


@dataclass(frozen=True)
class SegmentSpec:
    speaker: str
    start_seconds: int
    text: str


@dataclass(frozen=True)
class SectionSpec:
    heading: str
    body: str
    sequence: int


@dataclass(frozen=True)
class ActionItemSpec:
    title: str
    assignee: str | None = None
    due_date: str | None = None  # YYYY-MM-DD
    completed: bool = False


@dataclass(frozen=True)
class MeetingSpec:
    key: str  # unique seed key (used for idempotent upsert)
    title: str
    days_ago: int
    hour: int  # 24h, local time
    duration_minutes: int
    host: str
    channel: Channel
    capture_source: CaptureSource
    bookmarked: bool = False
    language: str = "English (Global)"
    participants: list[str] = field(default_factory=list)
    segments: list[SegmentSpec] = field(default_factory=list)
    overview: str = ""
    key_points: list[str] = field(default_factory=list)
    decisions: list[str] = field(default_factory=list)
    sections: list[SectionSpec] = field(default_factory=list)
    action_items: list[ActionItemSpec] = field(default_factory=list)


# ---------------------------------------------------------------------------
# 1. Q4 Product Strategy
# ---------------------------------------------------------------------------

Q4_PRODUCT_STRATEGY = MeetingSpec(
    key="q4-product-strategy",
    title="Q4 Product Strategy",
    days_ago=2,
    hour=10,
    duration_minutes=45,
    host="Naresh Yadav",
    channel="my",
    capture_source="upload",
    bookmarked=True,
    participants=["Naresh Yadav", "Sarah Chen", "Mike Lee", "Priya Iyer"],
    segments=[
        SegmentSpec("Naresh Yadav", 0, "Good morning everyone, let's get into the Q4 strategy review."),
        SegmentSpec("Naresh Yadav", 25, "We have three big bets this quarter: dashboard v2, onboarding redesign, and the pricing experiment."),
        SegmentSpec("Sarah Chen", 65, "For the dashboard, I'd like to focus on usage time and meeting completion rates as our leading indicators."),
        SegmentSpec("Mike Lee", 130, "I can take the onboarding redesign and run a weekly experiment cadence."),
        SegmentSpec("Priya Iyer", 210, "On pricing, I want to make sure we're tracking conversion rate and average contract value separately."),
        SegmentSpec("Naresh Yadav", 290, "Agreed. Let's land on dashboard v2 for the October launch."),
        SegmentSpec("Sarah Chen", 360, "I'll prepare the launch checklist and share it on Friday."),
        SegmentSpec("Mike Lee", 450, "Onboarding experiment plan will be ready by next Wednesday."),
        SegmentSpec("Priya Iyer", 530, "I'll build the pricing dashboard by the end of the month."),
        SegmentSpec("Naresh Yadav", 610, "Great, let's wrap with a quick risk review."),
        SegmentSpec("Sarah Chen", 700, "The biggest risk on dashboard is engineering bandwidth. We may need to defer analytics if we're tight."),
        SegmentSpec("Mike Lee", 800, "I can pull in a contractor for analytics if we hit that case."),
        SegmentSpec("Priya Iyer", 880, "Sounds reasonable, let's keep that as a contingency."),
        SegmentSpec("Naresh Yadav", 960, "Alright, I'll send out the recap email by end of day."),
        SegmentSpec("Sarah Chen", 1040, "Sounds good. Excited about this quarter."),
        SegmentSpec("Naresh Yadav", 1120, "Thanks everyone."),
    ],
    overview=(
        "The leadership team aligned on three Q4 product bets: dashboard v2 "
        "launch in October, onboarding redesign with weekly experiment cadence, "
        "and a pricing experiment tracked on conversion and contract value. "
        "Engineering bandwidth was identified as the primary risk; a "
        "contractor contingency was added for analytics work."
    ),
    key_points=[
        "Dashboard v2 is the launch target for October.",
        "Onboarding redesign will run on a weekly experiment cadence.",
        "Pricing experiment will track conversion and ACV separately.",
        "Engineering bandwidth is the main risk to the dashboard launch.",
    ],
    decisions=[
        "Launch dashboard v2 in October.",
        "Add a contractor contingency for analytics if engineering bandwidth is tight.",
        "Send out a recap email by end of day.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Q4 strategy reviewed across product, growth, and engineering. (00:25)\n"
                "- Three bets identified and owners assigned.\n"
                "- Risks acknowledged and contingencies agreed."
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Dashboard v2",
            body=(
                "- Launch target: October. (05:50)\n"
                "  - Owner: Sarah Chen\n"
                "  - Launch checklist due Friday.\n"
                "- Engineering bandwidth is the primary risk. (11:40)\n"
                "  - Contingency: pull in a contractor for analytics."
            ),
            sequence=2,
        ),
        SectionSpec(
            heading="Next Steps",
            body=(
                "- Mike: onboarding experiment plan by next Wednesday. (07:30)\n"
                "- Priya: pricing dashboard by end of month. (08:50)\n"
                "- Naresh: recap email by EOD. (16:00)"
            ),
            sequence=3,
        ),
    ],
    action_items=[
        ActionItemSpec("Prepare dashboard v2 launch checklist", "Sarah Chen", "2026-09-09"),
        ActionItemSpec("Draft onboarding experiment plan", "Mike Lee", "2026-09-14"),
        ActionItemSpec("Build pricing experiment dashboard", "Priya Iyer", "2026-09-30"),
        ActionItemSpec("Send recap email to leadership", "Naresh Yadav", "2026-09-07", completed=True),
        ActionItemSpec("Line up analytics contractor backup", "Mike Lee"),
    ],
)


# ---------------------------------------------------------------------------
# 2. Weekly Engineering Sync
# ---------------------------------------------------------------------------

WEEKLY_ENGINEERING_SYNC = MeetingSpec(
    key="weekly-engineering-sync",
    title="Weekly Engineering Sync",
    days_ago=4,
    hour=15,
    duration_minutes=30,
    host="Mike Lee",
    channel="my",
    capture_source="bot",
    participants=["Mike Lee", "Aarav Patel", "Sofia Rossi", "Daniel Cho"],
    segments=[
        SegmentSpec("Mike Lee", 0, "Quick round-robin — what's the highlight from this week?"),
        SegmentSpec("Aarav Patel", 20, "Landed the auth refactor behind a feature flag. Zero regressions in staging."),
        SegmentSpec("Sofia Rossi", 55, "Migrated the search index to v2. Latency is down 40 percent."),
        SegmentSpec("Daniel Cho", 100, "Investigated the dashboard crash. Root cause was a stale session token. Patch is out."),
        SegmentSpec("Mike Lee", 145, "Solid work, team. What are we worried about next week?"),
        SegmentSpec("Aarav Patel", 170, "The feature flag rollout on Friday. I'm confident, but we should be ready to roll back."),
        SegmentSpec("Sofia Rossi", 220, "Search index migration to production. Need to coordinate with on-call."),
        SegmentSpec("Daniel Cho", 265, "Stale sessions keep showing up in logs. Want to dig deeper."),
        SegmentSpec("Mike Lee", 310, "Sounds good. Let's plan a tabletop exercise for the roll-back path next Friday."),
        SegmentSpec("Aarav Patel", 340, "I'll draft the runbook."),
        SegmentSpec("Mike Lee", 380, "Perfect, thanks everyone."),
    ],
    overview=(
        "Engineering team shared highlights from the week — auth refactor behind "
        "a feature flag, search index migration with 40 percent latency reduction, "
        "and a stale-session dashboard crash fix. Risks for next week include the "
        "feature flag rollout, the production search migration, and continued stale-session "
        "investigations."
    ),
    key_points=[
        "Auth refactor behind feature flag, zero staging regressions.",
        "Search index v2 cut latency 40 percent.",
        "Dashboard crash traced to stale session tokens; patch deployed.",
    ],
    decisions=[
        "Run a tabletop exercise for the feature flag roll-back path next Friday.",
        "Draft runbook for the roll-back path.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Auth refactor shipped behind feature flag (00:20)\n"
                "- Search index v2 cut latency 40 percent (00:55)\n"
                "- Dashboard crash patched (stale session tokens) (01:40)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Risks",
            body=(
                "- Friday feature flag rollout (02:50)\n"
                "  - Mitigation: runbook + tabletop exercise\n"
                "- Search index migration to production (03:40)"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Draft feature flag roll-back runbook", "Aarav Patel", "2026-09-15"),
        ActionItemSpec("Coordinate on-call for search migration", "Sofia Rossi", "2026-09-12"),
        ActionItemSpec("Investigate root cause of stale sessions", "Daniel Cho"),
    ],
)


# ---------------------------------------------------------------------------
# 3. Customer Discovery — Acme Corp
# ---------------------------------------------------------------------------

CUSTOMER_DISCOVERY_ACME = MeetingSpec(
    key="customer-discovery-acme",
    title="Customer Discovery — Acme Corp",
    days_ago=7,
    hour=11,
    duration_minutes=40,
    host="Priya Iyer",
    channel="all",
    capture_source="upload",
    bookmarked=False,
    participants=["Priya Iyer", "Naresh Yadav", "Sarah Chen", "James Hollister (Acme Corp)"],
    segments=[
        SegmentSpec("Priya Iyer", 0, "Thanks for joining us today James, can you tell us about your current workflow?"),
        SegmentSpec("James Hollister (Acme Corp)", 30, "We have six reps and they live in three different tools."),
        SegmentSpec("James Hollister (Acme Corp)", 90, "Calls happen in one tool, notes in another, follow-ups in a third."),
        SegmentSpec("Sarah Chen", 150, "How much time per week does that cost each rep?"),
        SegmentSpec("James Hollister (Acme Corp)", 200, "We measured it last quarter. Roughly four hours per rep per week."),
        SegmentSpec("Naresh Yadav", 270, "And what would an ideal workflow look like?"),
        SegmentSpec("James Hollister (Acme Corp)", 320, "One source of truth. Automatic call recording. AI summaries that actually work."),
        SegmentSpec("James Hollister (Acme Corp)", 410, "And shared visibility across the team."),
        SegmentSpec("Priya Iyer", 500, "What does your current stack look like?"),
        SegmentSpec("James Hollister (Acme Corp)", 540, "Zoom for calls, Notion for notes, HubSpot for follow-ups."),
        SegmentSpec("Sarah Chen", 620, "Got it. What's your evaluation process like?"),
        SegmentSpec("James Hollister (Acme Corp)", 670, "We compare three vendors. We need SOC 2 and SSO at minimum."),
        SegmentSpec("Naresh Yadav", 760, "We have both. Anything else blocking a decision?"),
        SegmentSpec("James Hollister (Acme Corp)", 810, "Pricing model and a clear rollout plan for six reps."),
        SegmentSpec("Priya Iyer", 880, "We can put together a custom quote and a 30-day rollout plan."),
        SegmentSpec("James Hollister (Acme Corp)", 940, "Perfect. Send it over by Friday and we'll set up next steps."),
        SegmentSpec("Naresh Yadav", 1010, "Will do."),
    ],
    overview=(
        "Discovery call with Acme Corp (James Hollister). Their six sales reps lose "
        "roughly four hours per week juggling three tools (Zoom, Notion, HubSpot). "
        "They want one source of truth, automatic recording, AI summaries, and team "
        "visibility. Requirements: SOC 2 + SSO, transparent pricing, and a 30-day "
        "rollout plan for six reps. Next step: send a custom quote by Friday."
    ),
    key_points=[
        "Customer loses ~4 hours/rep/week across 3 tools.",
        "Wants single source of truth with auto-recording + AI summaries.",
        "Requires SOC 2 + SSO.",
        "Custom pricing and 30-day rollout plan for six reps.",
    ],
    decisions=[
        "Send a custom quote and 30-day rollout plan by Friday.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Current stack: Zoom + Notion + HubSpot. (09:00)\n"
                "- Pain point: 4 hours/rep/week lost to context switching. (03:20)\n"
                "- Buyer criteria: SOC 2 + SSO + clear pricing + rollout plan. (11:10)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Follow-up",
            body=(
                "- Naresh: prepare custom quote and rollout plan (14:40)\n"
                "  - Deliverable due: Friday\n"
                "- James: review and respond with next steps"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Build custom quote for Acme Corp", "Naresh Yadav", "2026-09-11"),
        ActionItemSpec("Draft 30-day rollout plan for six reps", "Naresh Yadav", "2026-09-11"),
        ActionItemSpec("Send follow-up email with deliverables", "Priya Iyer", "2026-09-11"),
    ],
)


# ---------------------------------------------------------------------------
# 4. Frontend Architecture Review
# ---------------------------------------------------------------------------

FRONTEND_ARCHITECTURE_REVIEW = MeetingSpec(
    key="frontend-architecture-review",
    title="Frontend Architecture Review",
    days_ago=12,
    hour=14,
    duration_minutes=50,
    host="Aarav Patel",
    channel="my",
    capture_source="desktop",
    bookmarked=False,
    participants=["Aarav Patel", "Sofia Rossi", "Daniel Cho", "Lin Hayashi"],
    segments=[
        SegmentSpec("Aarav Patel", 0, "Goal today: review the proposed state management refactor and lock in next steps."),
        SegmentSpec("Aarav Patel", 40, "We've been using a mix of context, redux, and ad-hoc hooks. It's not scaling."),
        SegmentSpec("Sofia Rossi", 110, "I agree. The new proposal is to consolidate everything behind a thin server-state layer."),
        SegmentSpec("Daniel Cho", 180, "How do we handle optimistic updates?"),
        SegmentSpec("Aarav Patel", 230, "TanStack Query has solid optimistic update primitives. We layer that on top."),
        SegmentSpec("Lin Hayashi", 310, "What about cross-tab sync?"),
        SegmentSpec("Aarav Patel", 360, "We'll use a focused store for the few state pieces that need it."),
        SegmentSpec("Sofia Rossi", 440, "Migration plan: do feature-flagged dual-write for two weeks, then cut over."),
        SegmentSpec("Daniel Cho", 540, "What's the rollback path?"),
        SegmentSpec("Aarav Patel", 600, "Feature flag lets us flip back instantly."),
        SegmentSpec("Lin Hayashi", 700, "I'll do a security review on the new abstraction layer."),
        SegmentSpec("Aarav Patel", 760, "Great. Anything else?"),
        SegmentSpec("Sofia Rossi", 810, "We should document the patterns in the team handbook."),
        SegmentSpec("Aarav Patel", 880, "I'll draft that this week."),
        SegmentSpec("Aarav Patel", 950, "Alright, that's a wrap."),
    ],
    overview=(
        "Frontend team agreed on a refactor: consolidate state management "
        "behind a thin server-state layer using TanStack Query with optimistic updates, "
        "with a focused store for cross-tab sync. Migration plan: feature-flagged "
        "dual-write for two weeks then cut over. Rollback via feature flag."
    ),
    key_points=[
        "Adopt a thin server-state layer (TanStack Query) with optimistic updates.",
        "Use a focused store for cross-tab sync.",
        "Migration plan: feature-flagged dual-write for two weeks, then cut over.",
        "Rollback path is just flipping the feature flag.",
    ],
    decisions=[
        "Approve the consolidated state management proposal.",
        "Migration via feature-flagged dual-write for two weeks.",
        "Document patterns in the team handbook.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Current state management is fragmented and not scaling. (01:50)\n"
                "- Proposal: thin server-state layer + focused store for cross-tab sync. (06:00)\n"
                "- Migration: dual-write behind feature flag, then cut over. (07:20)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Action Items",
            body=(
                "- Lin: security review of abstraction layer (11:40)\n"
                "- Aarav: team handbook section (13:30)"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Security review of state management layer", "Lin Hayashi", "2026-09-19"),
        ActionItemSpec("Draft team handbook section on state patterns", "Aarav Patel", "2026-09-19"),
    ],
)


# ---------------------------------------------------------------------------
# 5. Growth & Marketing Sync
# ---------------------------------------------------------------------------

GROWTH_MARKETING_SYNC = MeetingSpec(
    key="growth-marketing-sync",
    title="Growth & Marketing Sync",
    days_ago=9,
    hour=12,
    duration_minutes=25,
    host="Hannah Cohen",
    channel="my",
    capture_source="upload",
    bookmarked=True,
    participants=["Hannah Cohen", "Priya Iyer", "Marco Bianchi"],
    # NOTE: this transcript has 25s of idle; some segments are short.
    segments=[
        SegmentSpec("Hannah Cohen", 0, "Quick sync — what changed this week?"),
        SegmentSpec("Hannah Cohen", 18, "Email open rates are up 11 percent after the subject line test."),
        SegmentSpec("Priya Iyer", 50, "On the landing page we saw a 6 percent lift on the pricing CTA."),
        SegmentSpec("Marco Bianchi", 95, "Paid social is pacing under target. We're testing new creative."),
        SegmentSpec("Hannah Cohen", 150, "Let's double down on the subject line test winner."),
        SegmentSpec("Priya Iyer", 200, "I'll iterate the landing page copy next week."),
        SegmentSpec("Marco Bianchi", 260, "I'll have new creative variants ready by Wednesday."),
        SegmentSpec("Hannah Cohen", 340, "Perfect. Let's reconvene next week."),
    ],
    overview=(
        "Email open rates up 11 percent on the subject line A/B winner. Landing page "
        "pricing CTA lifted 6 percent. Paid social pacing under target — testing new "
        "creative variants. Next: double down on the subject test, iterate the "
        "landing page copy, and ship new social variants by Wednesday."
    ),
    key_points=[
        "Email open rates up 11 percent on subject line A/B.",
        "Landing page pricing CTA +6 percent.",
        "Paid social pacing under target — new creative in flight.",
    ],
    decisions=[
        "Double down on the subject line test winner.",
        "Iterate landing page copy next week.",
        "Ship new paid social variants by Wednesday.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Email open rates +11% (00:18)\n"
                "- Pricing CTA +6% (00:50)\n"
                "- Paid social pacing under target (01:35)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Next Steps",
            body=(
                "- Iterate landing page copy (03:20)\n"
                "- New social creative by Wednesday (04:20)"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Iterate landing page copy", "Priya Iyer", "2026-09-16"),
        ActionItemSpec("Ship new paid social creative", "Marco Bianchi", "2026-09-17"),
    ],
)


# ---------------------------------------------------------------------------
# 6. Hiring Debrief — Senior Engineer
# ---------------------------------------------------------------------------

HIRING_DEBRIEF = MeetingSpec(
    key="hiring-debrief-senior-engineer",
    title="Hiring Debrief — Senior Engineer",
    days_ago=15,
    hour=16,
    duration_minutes=35,
    host="Naresh Yadav",
    channel="my",
    capture_source="bot",
    bookmarked=False,
    participants=["Naresh Yadav", "Aarav Patel", "Sofia Rossi", "Hannah Cohen"],
    segments=[
        SegmentSpec("Naresh Yadav", 0, "Let's debrief on yesterday's loop interviews for the senior engineer role."),
        SegmentSpec("Aarav Patel", 30, "First candidate was strong on system design but weak on stakeholder communication."),
        SegmentSpec("Sofia Rossi", 90, "Second candidate had great communication but the system design was shallow."),
        SegmentSpec("Hannah Cohen", 160, "What about the third?"),
        SegmentSpec("Aarav Patel", 200, "Third candidate was solid across the board, but their salary expectation was 15 percent above band."),
        SegmentSpec("Naresh Yadav", 270, "We could counter at the top of band plus equity."),
        SegmentSpec("Sofia Rossi", 350, "I'd vote to make an offer. Their technical depth is rare."),
        SegmentSpec("Hannah Cohen", 430, "Agreed. Let's move forward."),
        SegmentSpec("Naresh Yadav", 500, "I'll send the offer draft tomorrow."),
        SegmentSpec("Aarav Patel", 560, "I'll review the system design notes and write up our decision."),
        SegmentSpec("Naresh Yadav", 640, "Thanks team."),
    ],
    overview=(
        "Hiring debrief for the senior engineer loop. Three candidates reviewed. "
        "Decision to make an offer to candidate #3 (strong across the board, "
        "salary 15 percent above). Counter at top of band plus equity. Aarav to "
        "write up the decision notes; Naresh to send the offer draft tomorrow."
    ),
    key_points=[
        "Three loop interviews reviewed.",
        "Candidate #3 strongest across the board but at top of band plus equity.",
        "Aarav to write up decision notes; Naresh to send offer draft.",
    ],
    decisions=[
        "Make an offer to candidate #3 at top of band plus equity.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Candidate #1: strong system design, weak stakeholder comms. (00:30)\n"
                "- Candidate #2: great comms, shallow system design. (01:30)\n"
                "- Candidate #3: solid across the board, salary +15%. (03:20)\n"
                "  - Decision: offer at top of band + equity."
            ),
            sequence=1,
        ),
    ],
    action_items=[
        ActionItemSpec("Send offer draft to candidate", "Naresh Yadav", "2026-09-18"),
        ActionItemSpec("Document hiring decision notes", "Aarav Patel", "2026-09-22"),
    ],
)


# ---------------------------------------------------------------------------
# 7. Sprint Planning
# ---------------------------------------------------------------------------

SPRINT_PLANNING = MeetingSpec(
    key="sprint-planning",
    title="Sprint Planning",
    days_ago=18,
    hour=10,
    duration_minutes=60,
    host="Mike Lee",
    channel="my",
    capture_source="upload",
    bookmarked=False,
    participants=["Mike Lee", "Aarav Patel", "Sofia Rossi", "Daniel Cho", "Lin Hayashi"],
    segments=[
        SegmentSpec("Mike Lee", 0, "Sprint planning — let's keep this tight."),
        SegmentSpec("Mike Lee", 25, "Sprint goal: ship the search migration and clear the auth backlog."),
        SegmentSpec("Aarav Patel", 70, "I'll take the auth backlog. Five tickets, point estimate twelve."),
        SegmentSpec("Sofia Rossi", 130, "Search migration is the big one. I'd like to split it."),
        SegmentSpec("Daniel Cho", 200, "I'll handle the production index cutover."),
        SegmentSpec("Lin Hayashi", 260, "And I'll take the roll-back runbook."),
        SegmentSpec("Aarav Patel", 320, "Any cross-team dependencies?"),
        SegmentSpec("Mike Lee", 350, "On-call coordination needed for the search migration."),
        SegmentSpec("Sofia Rossi", 410, "I'll loop in Daniel before the cutover."),
        SegmentSpec("Mike Lee", 470, "What about carryover from last sprint?"),
        SegmentSpec("Daniel Cho", 510, "Two tickets from last sprint — dashboard crash patch and the stale session investigation."),
        SegmentSpec("Mike Lee", 580, "We'll roll those into this sprint."),
        SegmentSpec("Mike Lee", 640, "Velocity looks healthy. Let's call it."),
    ],
    overview=(
        "Sprint planning for the upcoming two-week sprint. Goal: ship the search "
        "index migration to production and clear the auth backlog. Points allocated "
        "across the team; two carryover tickets from last sprint rolled in. "
        "On-call coordination needed for the search migration cutover."
    ),
    key_points=[
        "Sprint goal: search migration + clear auth backlog.",
        "Search cutover split across Sofia (prep), Daniel (cutover), Lin (runbook).",
        "Two carryover tickets from last sprint rolled in.",
        "On-call coordination required for the search cutover.",
    ],
    decisions=[
        "Adopt the proposed sprint goal and ownership plan.",
        "Roll the two carryover tickets into this sprint.",
    ],
    sections=[
        SectionSpec(
            heading="Notes",
            body=(
                "- Sprint goal: search migration + auth backlog. (00:25)\n"
                "- Ownership split:\n"
                "  - Aarav: auth backlog (12 pts). (01:10)\n"
                "  - Sofia: search migration prep. (02:10)\n"
                "  - Daniel: production cutover. (03:20)\n"
                "  - Lin: roll-back runbook. (04:20)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Carryover",
            body=(
                "- Dashboard crash patch (08:30)\n"
                "- Stale session investigation (08:50)"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Drive auth backlog tickets", "Aarav Patel", "2026-09-25"),
        ActionItemSpec("Coordinate on-call for search migration cutover", "Sofia Rossi", "2026-09-19"),
        ActionItemSpec("Lead production search cutover", "Daniel Cho", "2026-09-22"),
        ActionItemSpec("Write search cutover runbook", "Lin Hayashi", "2026-09-20"),
        ActionItemSpec("Investigate root cause of stale sessions", "Daniel Cho"),
    ],
)


# ---------------------------------------------------------------------------
# 8. Investor Update
# ---------------------------------------------------------------------------

INVESTOR_UPDATE = MeetingSpec(
    key="investor-update",
    title="Investor Update",
    days_ago=25,
    hour=9,
    duration_minutes=20,
    host="Naresh Yadav",
    channel="my",
    capture_source="upload",
    bookmarked=True,
    participants=["Naresh Yadav", "Sarah Chen"],
    segments=[
        SegmentSpec("Naresh Yadav", 0, "Quick walkthrough of this month's investor update."),
        SegmentSpec("Naresh Yadav", 30, "MRR is up 18 percent month over month driven by the new pricing tier."),
        SegmentSpec("Sarah Chen", 80, "Burn rate is flat; runway extended to eighteen months."),
        SegmentSpec("Naresh Yadav", 140, "Two key wins: enterprise pilot signed, NPS up 12 points."),
        SegmentSpec("Sarah Chen", 200, "One risk: churn uptick in the SMB segment, watching closely."),
        SegmentSpec("Naresh Yadav", 260, "Send out by EOD Friday."),
    ],
    overview=(
        "Investor update for the month: MRR up 18 percent MoM, burn rate flat, "
        "runway extended to eighteen months. Two key wins (enterprise pilot, "
        "NPS +12) and one risk to watch (SMB churn uptick). Update to ship Friday."
    ),
    key_points=[
        "MRR up 18 percent MoM driven by new pricing tier.",
        "Burn flat; runway extended to eighteen months.",
        "Enterprise pilot signed; NPS up 12 points.",
        "Watching SMB churn uptick.",
    ],
    decisions=[
        "Ship the investor update by EOD Friday.",
    ],
    sections=[
        SectionSpec(
            heading="Highlights",
            body=(
                "- MRR +18% MoM (00:30)\n"
                "- Burn flat; runway 18 months (01:20)\n"
                "- Enterprise pilot signed (02:20)\n"
                "- NPS +12 (02:20)"
            ),
            sequence=1,
        ),
        SectionSpec(
            heading="Risks",
            body=(
                "- SMB churn uptick (03:20)\n"
                "  - Status: watching closely"
            ),
            sequence=2,
        ),
    ],
    action_items=[
        ActionItemSpec("Send investor update to investors", "Naresh Yadav", "2026-09-13", completed=True),
    ],
)


ALL_MEETINGS: list[MeetingSpec] = [
    Q4_PRODUCT_STRATEGY,
    WEEKLY_ENGINEERING_SYNC,
    CUSTOMER_DISCOVERY_ACME,
    FRONTEND_ARCHITECTURE_REVIEW,
    GROWTH_MARKETING_SYNC,
    HIRING_DEBRIEF,
    SPRINT_PLANNING,
    INVESTOR_UPDATE,
]