# Chokhmah Expansion: Google Calendar + Gmail Integration for Personal Operating System Dashboard

**Date:** 2026-03-21
**Scope:** Deep integration of Google Calendar and Gmail into the zev.ai admin backend, transforming it from a CRM/agent dashboard into a true personal operating system.

---

## 1. Competitive Landscape: What "Personal Operating System" Looks Like in 2026

The category of "personal OS" tools has consolidated around a clear pattern: **calendar + tasks + email + notes, unified in a single view with a command bar**. The best-in-class tools to study and steal from:

**Amie** ($6-21/mo) — The design gold standard. Calm color palette, generous white space, drag-and-drop from email inbox to task list. AI meeting notes recorded locally (no bot joining calls). Integrates Linear, Notion, Todoist. Reviewers call it "fast, elegant, a daily driver." Key insight: *tasks and calendar events live on the same timeline*, not in separate tabs.

**Akiflow** ($15/mo) — The power-user command center. Desktop-first, keyboard-driven. Pulls tasks from Slack, Gmail, Notion, Asana into a single inbox. Command bar for instant task creation. Best-in-class for "consolidate everything, process it fast." Key insight: *the universal inbox pattern* where items from every source arrive in one queue.

**Sunsama** ($16/mo) — The intentional daily planner. Morning planning ritual: review what came in, estimate effort, assign to time blocks. Anti-burnout philosophy. Integrates Gmail, Outlook, Todoist, Trello, Jira, GitHub. Key insight: *the daily planning ceremony* and explicit time-boxing of tasks.

**Routine** ($8/mo) — Closest to "personal OS." Calendar + tasks + notes + contacts in one app. Command bar for everything (Cmd+K). Every calendar event has an embedded notes section; action items from meetings become schedulable tasks automatically. Contact management built in. Key insight: *every entity is connected* -- a meeting creates notes, notes create tasks, tasks link to contacts.

**Morgen** ($9/mo) — Cross-platform calendar unifier. Connects Google Calendar, Outlook, iCloud, CalDAV. Unified task inbox pulling from Todoist, Asana, ClickUp, Linear, GitHub. "Frames" feature for custom views. Key insight: *the unified inbox* that aggregates tasks from external tools alongside calendar.

**Notion Calendar (formerly Cron)** (free) — Developer-friendly, keyboard-first. Deep Notion integration: sees Notion database items alongside calendar events. Clean, minimal design. Key insight: *database-first thinking* where calendar is a view on structured data.

**What Zev's dashboard can learn from all of them:**
The best personal OS tools share five features: (1) a unified timeline showing tasks + events together, (2) a command bar / quick capture, (3) email integration that turns messages into actionable items, (4) contact/CRM context attached to meetings, and (5) a daily briefing / "today" view.

---

## 2. Google Calendar Integration: The Full Option Space

### Option A: Iframe Embed (Simplest, Most Limited)

**How it works:** Google provides a public embed URL that renders a fully interactive calendar inside an iframe.

**Embed URL format:**
```
https://calendar.google.com/calendar/embed?src=YOUR_CALENDAR_ID@gmail.com&ctz=America/New_York&mode=WEEK&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=1&showCalendars=0&showTz=0&bgcolor=%230a0e1a&color=%237c9bf5
```

**All available URL parameters:**
- `src` — Calendar ID (your email for primary calendar; can add multiple `&src=` for multiple calendars)
- `mode` — Default view: `WEEK`, `MONTH`, or `AGENDA`
- `bgcolor` — Background color (URL-encoded hex, e.g., `%230a0e1a` for `#0a0e1a`)
- `color` — Event color per calendar source
- `showTitle` — 0/1 (calendar title bar)
- `showNav` — 0/1 (forward/back navigation arrows)
- `showDate` — 0/1 (current date display)
- `showPrint` — 0/1 (print icon)
- `showTabs` — 0/1 (Week/Month/Agenda tab switcher)
- `showCalendars` — 0/1 (calendar list sidebar)
- `showTz` — 0/1 (timezone display)
- `ctz` — Timezone (e.g., `America/New_York`)
- `wkst` — Week start day (1=Sunday, 2=Monday)
- `height` / `width` — Iframe dimensions

**Dark mode workaround via CSS filter:**
```css
iframe.gcal-embed {
  filter: invert(0.88) hue-rotate(180deg) contrast(0.9);
  border-radius: 12px;
  border: 1px solid var(--color-admin-border);
}
```
This inverts colors (making white backgrounds dark), then rotates hues back so colors look natural. The `0.88` invert value prevents full-black and preserves readability. Combined with `bgcolor=%23ffffff` on the embed URL, this produces a dark-theme calendar.

**Requirements:** Calendar must be set to "public" in Google Calendar settings (Settings > calendar > Access permissions > Make available to public). For a personal calendar with private events, this is a significant privacy tradeoff.

**Pros:** Zero backend code, instant, interactive (can click events), responds to Google Calendar changes in real-time.
**Cons:** Cannot truly style it (CSS filter is a hack), requires public calendar, no programmatic access to event data, no dark mode natively, iframe cross-origin restrictions prevent JS interaction, looks foreign inside a polished admin UI.

### Option B: Styled Calendar (Third-Party Embed Service)

**How it works:** StyledCalendar.com reads your Google Calendar and renders a fully customizable embed widget. Over 80 style settings including colors, typography, layout. Dark mode support built in.

**Pros:** True dark theme, responsive, no code needed, better-looking than raw Google embed.
**Cons:** Third-party dependency, free tier has limitations, still an iframe/embed (not native React).

### Option C: Google Calendar API + Custom React Calendar Component (Recommended)

**How it works:** Server-side API calls to Google Calendar API v3, render events in a custom React calendar component (FullCalendar or react-big-calendar) styled to match the admin design system.

**Authentication approaches for a single personal user:**

1. **OAuth 2.0 with offline refresh token (recommended):**
   - Create a Google Cloud project, enable Calendar API + Gmail API
   - Configure OAuth consent screen as "External", keep in "Testing" status
   - Add your own Google account as a test user
   - One-time OAuth flow to get a refresh token (set `access_type: "offline"`, `prompt: "consent"`)
   - Store refresh token in env vars / Supabase secrets
   - Server-side route handler uses refresh token to get fresh access tokens
   - No verification needed for personal use (< 100 users), just click through "unverified app" warning once
   - **Important:** In "Testing" status, refresh tokens expire after 7 days. To avoid this, either: (a) publish the app (users still see unverified warning but tokens don't expire), or (b) re-auth periodically

2. **Service account with calendar sharing:**
   - Create a service account in Google Cloud Console
   - Share your personal calendar with the service account's email address
   - Service account authenticates with a JSON key file, no user interaction needed
   - **Limitation:** Works for Google Workspace accounts with domain-wide delegation. For consumer @gmail.com accounts, you must manually share each calendar with the service account email. This works for read access but is less reliable for write access.
   - **Best for:** Read-only calendar display where you share your calendar once and forget about it

**React calendar component options:**

1. **FullCalendar** (`@fullcalendar/react` + `@fullcalendar/google-calendar`)
   - Most feature-complete: week/month/day/agenda views, drag-and-drop, event resizing
   - Built-in Google Calendar plugin (just needs an API key for public calendars)
   - CSS variables for theming (`--fc-border-color`, `--fc-bg-color`, etc.)
   - Premium features (timeline, resource views) require paid license ($599/yr)
   - Free tier is sufficient for personal calendar display

2. **react-big-calendar** + **shadcn/ui Big Calendar**
   - Open source, Google Calendar-like design out of the box
   - `shadcn-ui-big-calendar` variant uses CSS variables for seamless dark/light theming
   - No built-in Google Calendar plugin -- you fetch events via API and pass as props
   - More lightweight than FullCalendar
   - Better for a fully custom look since you control all rendering

3. **Custom-built calendar grid (maximum control)**
   - Build a week/day view as pure React + Tailwind
   - Most work, but guaranteed to match admin design system perfectly
   - Can show events as overlapping blocks like Google Calendar
   - Start with the week strip pattern already in the Family Hub page, expand it

**API route pattern for fetching events:**
```typescript
// /api/admin/calendar/route.ts
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export async function GET() {
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return Response.json(res.data.items);
}
```

### Option D: iCal Subscription URL (Read-Only Sync)

**How it works:** Google Calendar provides a "Secret address in iCal format" URL that returns an `.ics` file with all events. Server-side, parse this with a library like `ical.js` or `node-ical`.

**URL format:** Found in Google Calendar Settings > calendar > Integrate calendar > "Secret address in iCal format"
Example: `https://calendar.google.com/calendar/ical/YOUR_EMAIL/private-HASH/basic.ics`

**Pros:** No OAuth needed, just a secret URL. Simple to parse.
**Cons:** Read-only (no creating/updating events), no real-time updates (must poll), can be slow for large calendars, no attendee/RSVP data.

### Option E: CalDAV Protocol

Google supports CalDAV at `https://apidata.googleusercontent.com/caldav/v2/` but requires OAuth 2.0 over HTTPS. Adds complexity without clear benefit over the REST API (Option C). Not recommended unless you need interop with other CalDAV clients.

### Option F: MCP Tools (For AI-Assisted Calendar Management)

The user already has access to MCP tools:
- `gcal_list_events`, `gcal_create_event`, `gcal_get_event`, `gcal_delete_event`
- `gcal_find_meeting_times`, `gcal_find_my_free_time`
- `gcal_list_calendars`, `gcal_respond_to_event`, `gcal_update_event`

These are ideal for the **Admin Chat** (`/admin/chat`) integration -- letting Zev ask Claude "What's on my calendar tomorrow?" or "Schedule a 30-min call with John next week" and having the AI assistant actually do it via MCP tools. This is the killer differentiator vs. off-the-shelf tools.

---

## 3. Gmail Integration: The Full Option Space

### Gmail Cannot Be Embedded in an Iframe
Gmail sets `X-Frame-Options: DENY` and `Content-Security-Policy: frame-ancestors 'self'`. There is no workaround. Any approach involving iframes will fail.

### Option A: Gmail Deep Links (Simplest, No API Needed)

Open Gmail in a new tab with pre-filtered views:

**URL patterns:**
- Inbox: `https://mail.google.com/mail/u/0/#inbox`
- Search: `https://mail.google.com/mail/u/0/#search/from%3Aclient%40company.com`
- Label: `https://mail.google.com/mail/u/0/#label/AI+Consulting`
- Starred: `https://mail.google.com/mail/u/0/#starred`
- Unread: `https://mail.google.com/mail/u/0/#search/is%3Aunread`
- Compose new: `https://mail.google.com/mail/u/0/#inbox?compose=new`
- Compose pre-filled: `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=client@example.com&su=Follow+Up&body=Hi+there`
- All mail: `https://mail.google.com/mail/u/0/#all`
- Specific message: `https://mail.google.com/mail/u/0/#all/MESSAGE_ID`

**Dashboard widget idea:** A row of quick-link buttons:
```
[Inbox (3)] [Unread] [Starred] [AI Consulting] [Compose] [Search...]
```
Where "Inbox (3)" shows count from Gmail API, clicking opens Gmail tab.

### Option B: Gmail API for Reading/Displaying Emails in Dashboard

**How it works:** Use the same OAuth2 credentials from Calendar to also access Gmail API. Fetch recent messages, display as a feed in the dashboard.

**API capabilities:**
- `users.messages.list` — List messages matching a query (supports full Gmail search syntax: `is:unread`, `from:example@gmail.com`, `newer_than:2d`, `has:attachment`, label filters)
- `users.messages.get` — Get full message content (headers, body, attachments)
- `users.threads.list` / `users.threads.get` — Thread-based view
- `users.labels.list` — Get all labels
- `users.getProfile` — Get email address, total messages, threads count

**Dashboard widget possibilities:**
1. **Recent Emails Feed** — Last 10 emails with sender, subject, snippet, timestamp. Click opens in Gmail.
2. **Unread Count Badge** — Show unread count on the dashboard nav item or as a stat card.
3. **Client Email Context** — On the Discoveries/Contacts page, show recent emails from that contact.
4. **Email-to-Task** — "Convert to task" button that creates a Family Hub task from an email subject/snippet.

**Scopes needed:**
- `https://www.googleapis.com/auth/gmail.readonly` — Read messages and labels (recommended: least privilege)
- `https://www.googleapis.com/auth/gmail.compose` — Create drafts and send (only if composing from dashboard)
- `https://mail.google.com/` — Full access (only if needed, this is a "restricted" scope requiring extra verification)

### Option C: Gmail MCP Tools (For AI-Assisted Email)

Available tools:
- `gmail_search_messages` — Search with Gmail query syntax
- `gmail_read_message` — Read specific message
- `gmail_read_thread` — Read full thread
- `gmail_create_draft` — Create a draft email
- `gmail_list_labels` — List all labels
- `gmail_get_profile` — Get profile info

**Power use case for Admin Chat:** "Show me all emails from ButcherBox this month" or "Draft a follow-up email to the discovery from Blank Industries" -- the AI assistant uses MCP tools to search Gmail, read context, and draft responses. This turns the admin chat into a true executive assistant.

### Option D: Google Pub/Sub for Real-Time Email Notifications

**How it works:** Gmail API can push notifications via Google Cloud Pub/Sub when new emails arrive.

**Setup:**
1. Create a Pub/Sub topic in Google Cloud Console
2. Grant `gmail-api-push@system.gserviceaccount.com` the Pub/Sub Publisher role on the topic
3. Create a push subscription pointing to your webhook URL (e.g., `/api/webhooks/gmail`)
4. Call `gmail.users.watch()` to start watching the mailbox (must renew every 7 days)
5. When a new email arrives, Google pushes a notification with `historyId` to your webhook
6. Your webhook fetches the actual message using `history.list()` with that `historyId`

**Challenges:** Requires a publicly accessible HTTPS endpoint (fine for Vercel), watch must be renewed every 7 days (pg_cron job), notification only contains `historyId` not the message itself (need an additional API call).

**Use case:** Show a real-time "new email" indicator on the dashboard without polling.

---

## 4. Product Completeness: What a True Personal OS Dashboard Needs

### The "Today" View (Most Important Missing Piece)

Every great personal OS starts with a "today" briefing. The current admin dashboard shows agent stats and pipeline data -- but not "what does Zev's day look like?" The today view should unify:

- **Calendar block:** Next 3-5 events with times, attendees, meeting links
- **Task focus:** Top 3-5 tasks for today (from Family Hub + Projects)
- **Email snapshot:** Unread count, any flagged/important emails
- **Pipeline activity:** New discoveries, pending reviews
- **Weather** (optional but every personal OS has it)
- **Daily quote or intention** (aligns with Sunsama's planning philosophy)

### Command Bar / Quick Capture (Cmd+K)

A universal command palette that can:
- Create a task ("Buy groceries for Shabbat dinner @Irit #high")
- Create an event ("Meeting with ButcherBox Tuesday 2pm")
- Search across all admin sections (contacts, discoveries, content, knowledge)
- Quick-navigate to any admin page
- Trigger agent actions ("Run content pipeline", "Generate social posts")
- Open Gmail search in new tab

This already exists conceptually with the Admin Chat, but a lightweight Cmd+K palette for quick actions would complement it.

### Unified Inbox / Notification Center

Aggregate items that need attention from all sources:
- Tier 3 agent decisions awaiting Crown review
- Pending social posts for approval
- Blog posts in "review" status
- Overdue family tasks
- New discovery form submissions
- Unpaid invoices past due date
- (Future) Unread important emails

### Calendar + Task Timeline

A combined view showing calendar events and tasks on the same timeline, a la Amie/Akiflow. Time blocks from Google Calendar interleaved with task deadlines from Family Hub and project milestones.

### Contact Context Sidebar

When viewing a discovery or contact, show:
- Recent emails with this person (Gmail API)
- Upcoming meetings (Calendar API)
- Related discoveries/proposals
- Knowledge base entries mentioning them
- Notes from Family Hub if they're a personal contact

---

## 5. UX Patterns and Implementation Approaches

### The "Glanceable Widget Grid" Pattern

The admin dashboard (`/admin`) should adopt a widget grid layout:

```
+---------------------------+-------------------+
|  TODAY'S SCHEDULE (GCal)  |  EMAIL SNAPSHOT   |
|  [event blocks with       |  [3 unread]       |
|   times and attendees]    |  [recent list]    |
+---------------------------+-------------------+
|  FOCUS TASKS              |  PIPELINE STATUS  |
|  [top 5 tasks, checkbox]  |  [stage funnel]   |
+---------------------------+-------------------+
|  AGENT ACTIVITY FEED      |  QUICK ACTIONS    |
|  [scrolling log]          |  [button grid]    |
+---------------------------+-------------------+
```

### The "Split Pane" Calendar Pattern

For the Family Hub or a dedicated `/admin/calendar` page:
- Left 60%: Full week calendar view (react-big-calendar or custom)
- Right 40%: Today's task list + quick capture + upcoming events list
- Bottom: Mini month navigator + calendar list (toggle work/personal/family)

### The "Email Feed" Pattern

A compact email widget showing:
```
[Avatar] John Smith — RE: Proposal Review     2h ago
         "Thanks for sending over the..."
[Avatar] ButcherBox Team — Q2 Planning         5h ago
         "Hi Zev, following up on..."
```
Each row is clickable, opens Gmail in new tab to that specific message.

### Empty/Loading/Error States

- **Calendar loading:** Skeleton blocks in the calendar grid with pulsing animation
- **Calendar error (auth expired):** "Reconnect Google Calendar" button with re-auth flow
- **No events today:** "Your day is clear" with a subtle illustration
- **Gmail not connected:** "Connect Gmail to see your inbox" card with OAuth button
- **API rate limited:** "Calendar data cached from X minutes ago" indicator

---

## 6. Technical Architecture Approaches

### Approach A: API Routes + Client Polling

- `/api/admin/calendar` — fetches events, caches 60s
- `/api/admin/gmail` — fetches recent emails, caches 60s
- Client polls every 60s for updates
- Simplest to build, adequate for personal use

### Approach B: API Routes + Supabase Realtime Bridge

- API route fetches from Google, writes to a Supabase `calendar_events_cache` table
- pg_cron job refreshes cache every 5 minutes
- Client subscribes to Supabase Realtime on the cache table
- Near-real-time updates without polling Google directly
- Better for "alive" dashboard feel

### Approach C: Edge Function Workers + Push

- Supabase Edge Function handles Google API calls
- Gmail Pub/Sub webhook pushes to Edge Function
- Calendar webhook (Events: watch) pushes changes
- Edge Function writes to Supabase tables
- Client gets Realtime subscription
- Most complex but truly real-time

### OAuth Token Management

- Store `GOOGLE_REFRESH_TOKEN` in Vercel env vars
- On each API call, use refresh token to get a fresh access token
- Access tokens expire in 1 hour; `googleapis` library handles refresh automatically
- If refresh token is revoked, surface error in dashboard with "Reconnect" button
- Consider storing tokens in Supabase `tola_config` table for Edge Function access

### Required Google Cloud Setup

1. Create project in Google Cloud Console
2. Enable APIs: Google Calendar API, Gmail API
3. Configure OAuth consent screen (External, Testing status)
4. Add your Google account as test user
5. Create OAuth 2.0 Client ID (Web application type)
6. Set authorized redirect URI (e.g., `https://zev-ai-swart.vercel.app/api/auth/google/callback`)
7. One-time OAuth flow to obtain refresh token
8. Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` in env vars

---

## 7. Monetization and Business Model Considerations

This is a personal tool, not a product to sell. But it IS a demo piece for consulting clients. The integration quality matters for:

- **Prospect demos:** "Here's how we build integrated operating systems" -- showing a live calendar + email + CRM + AI agent dashboard is compelling
- **Case study material:** "We built a personal OS that unifies Google Workspace with custom AI agents" is a strong portfolio piece
- **Framework licensing:** If TOLA ever becomes a licensable framework, Google Workspace integration is table-stakes

---

## 8. Risks, Unknowns, and Open Questions

### Authentication Complexity
- Google OAuth for personal (consumer) accounts requires "Testing" status or going through verification. In Testing status, refresh tokens expire every 7 days unless the app is published. Publishing an unverified app shows a warning screen but tokens persist.
- **Decision needed:** Accept the 7-day token expiry and build a re-auth flow, OR publish the app as unverified (which just means clicking through a warning screen once)?

### Privacy Considerations
- Calendar events and email subjects/snippets will be fetched through your Vercel backend. If the admin dashboard is ever compromised, this data is exposed.
- The existing admin auth (hashed password cookie) is adequate for personal use but would need upgrading for production multi-user scenarios.

### API Quotas
- Google Calendar API: 1,000,000 queries/day (not a concern)
- Gmail API: 250 quota units/user/second, 15 billion quota units/day. `messages.list` costs 5 units, `messages.get` costs 5 units. Fetching 10 emails every 60s = 100 units/min = well within limits.

### MCP vs API: Which to Build First?
- MCP tools are already available and work through Claude/Admin Chat
- Building custom API integration gives you a visual widget in the dashboard
- **Recommendation:** Build API-based visual widgets for calendar and email display, use MCP tools for AI-assisted actions (drafting emails, scheduling events through chat)

### Google Workspace vs Consumer Account
- Service accounts with domain-wide delegation only work with Google Workspace (paid) accounts
- For a personal @gmail.com account, OAuth2 is the only reliable path for full read/write access
- Service account + calendar sharing works for read-only calendar access on consumer accounts

### What About Apple Calendar / iCloud?
- If Zev uses Apple Calendar in addition to Google Calendar, consider CalDAV as a unifying protocol
- Or simply subscribe to Apple calendars in Google Calendar first, then read everything from Google

---

## 9. Things Nobody Asked About But Should Consider

### Meeting Prep Auto-Population
When a calendar event is 15 minutes away, automatically:
- Pull up the contact record from Discoveries/Contacts
- Show their discovery form data and assessment results
- Display recent emails with them
- Show relevant Knowledge Base entries
- This is the Oracle agent's natural territory

### Email-to-Discovery Pipeline
When an email arrives from a new prospect, offer a one-click "Create Discovery" that pre-fills the discovery form with:
- Name and email from the sender
- Company extracted from email domain
- Message content as initial context

### Calendar-Aware Agent Scheduling
Use calendar data to:
- Avoid running expensive agents during meeting-heavy hours
- Schedule content publishing for calendar gaps
- Trigger meeting prep workflows automatically before events

### Unified Search Across All Data Sources
A single search bar that queries:
- Supabase (contacts, discoveries, knowledge, blog posts)
- Google Calendar (events matching query)
- Gmail (emails matching query)
- Returns unified results with type indicators

### Daily Digest Email
A morning email (via Resend) summarizing:
- Today's calendar events
- Overdue tasks
- Pending pipeline items
- New contact form submissions
- Agent activity overnight
This already has infrastructure in the Crown agent's daily governance digest

### Offline / Error State Resilience
If Google APIs are down or tokens expire:
- Cache the last successful calendar/email fetch
- Show "last updated X minutes ago" indicator
- Surface reconnection UI prominently but not intrusively
- Never block the rest of the dashboard for a Google API failure

### Mobile Responsiveness
The admin dashboard is desktop-focused, but calendar and email widgets should degrade gracefully on mobile:
- Calendar switches from week view to agenda/list view
- Email widget shows just unread count, not full feed
- Quick capture bar remains accessible

### Privacy Toggle
A simple toggle to hide calendar/email widgets during screen sharing or demos:
- "Privacy Mode" button that replaces real data with placeholder content
- Or just hides the Google integration widgets entirely
- Important for consulting demos where you don't want client emails visible

---

## 10. Recommended Integration Priority (Options, Not Decisions)

**Phase 1 — Visual Calendar Widget (High Impact, Moderate Effort)**
Google Calendar API + react-big-calendar or custom component on `/admin` dashboard and/or `/admin/family` page. Dark-themed, showing today's events.

**Phase 2 — Gmail Quick Links + Unread Count (High Impact, Low Effort)**
Gmail API for unread count badge + deep link buttons to filtered Gmail views. No need to render full email content.

**Phase 3 — Today Briefing View (High Impact, High Effort)**
Unified "Today" widget combining calendar events + tasks + email count + pipeline status. This is the centerpiece of the personal OS feeling.

**Phase 4 — AI-Powered Calendar/Email via Chat (Differentiator)**
Use existing MCP tools through Admin Chat for natural-language calendar management and email triage. "What meetings do I have tomorrow?" "Draft a follow-up to the ButcherBox thread."

**Phase 5 — Meeting Prep Automation (Advanced)**
Calendar webhook triggers Oracle agent to auto-populate meeting context 15 minutes before events. The "AI executive assistant" wow factor.

**Phase 6 — Real-Time Email Push (Nice-to-Have)**
Gmail Pub/Sub notifications for live "new email" indicators. Only worth the complexity if the dashboard is the primary interface all day.

---

## Sources

- [Google Calendar Embed Dark Mode Discussion](https://support.google.com/calendar/thread/321483402)
- [SitePoint: Customizing Embedded Google Calendar Colors](https://www.sitepoint.com/community/t/can-i-customise-the-colours-in-an-embedded-google-calendar/404195)
- [Google Workspace New Calendar Design + Dark Mode](https://workspaceupdates.googleblog.com/2024/10/new-look-and-feel-and-dark-mode-google-calendar.html)
- [Nightwolf: Embed Google Calendar Parameters](https://nightwolf.dev/embed-a-google-calendar-in-a-web-page/)
- [Google Calendar API: Push Notifications](https://developers.google.com/workspace/calendar/api/guides/push)
- [Gmail API: Push Notifications via Pub/Sub](https://developers.google.com/gmail/api/guides/push)
- [Gmail API: Search and Filter Messages](https://developers.google.com/workspace/gmail/api/guides/filtering)
- [Gmail API: List Messages](https://developers.google.com/workspace/gmail/api/guides/list-messages)
- [Google OAuth2: Server to Server Applications](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Google OAuth2: Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth App Verification Exemptions](https://support.google.com/cloud/answer/13464323)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Simon Willison: Gmail Compose URL Patterns](https://til.simonwillison.net/google/gmail-compose-url)
- [Gmail URL Deep Link Analysis](https://arsenalrecon.com/insights/digging-into-gmail-urls)
- [FullCalendar React Docs](https://fullcalendar.io/docs/react)
- [FullCalendar Google Calendar Plugin](https://fullcalendar.io/docs/google-calendar)
- [FullCalendar CSS Customization](https://fullcalendar.io/docs/css-customization)
- [shadcn-ui-big-calendar (Dark Theme)](https://github.com/list-jonas/shadcn-ui-big-calendar)
- [react-big-calendar](https://github.com/jquense/react-big-calendar)
- [Styled Calendar: Customizable Embeds](https://styledcalendar.com/)
- [Google Calendar MCP Server](https://github.com/nspady/google-calendar-mcp)
- [Google Workspace MCP Server (Gmail + Calendar)](https://github.com/j3k0/mcp-google-workspace)
- [Google Workspace MCP by aaronsb](https://github.com/aaronsb/google-workspace-mcp)
- [Akiflow vs Sunsama Comparison](https://akiflow.com/blog/akiflow-vs-sunsama-comparison)
- [Amie Calendar Review 2025](https://skywork.ai/blog/amie-review-2025-calendar-tasks-ai-meeting-notes/)
- [Routine App Review](https://skywork.ai/skypage/en/Routine-App-Review-The-AI-Powered-Command-Center-for-Your-Life/1976123801621688320)
- [Morgen Calendar Management](https://www.morgen.so/blog-posts/best-calendar-management-tools)
- [Google CalDAV API Guide](https://developers.google.com/workspace/calendar/caldav/v2/guide)
- [Google Calendar Sync via iCal](https://support.google.com/calendar/answer/37648)
- [Gmail Webhook with Pub/Sub (Node.js)](https://stateful.com/blog/google-calendar-webhooks)
- [Google Calendar Service Account Integration](https://medium.com/iceapple-tech-talks/integration-with-google-calendar-api-using-service-account-1471e6e102c8)
- [Build a Scheduling Page with Next.js and Google APIs](https://dev.to/timfee/build-and-host-your-own-calendy-like-scheduling-page-using-nextjs-and-google-apis-5ack)
