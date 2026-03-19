# Zev.AI Operations Standard Operating Procedures

## 1. Daily Ops — Morning Checklist

Open the admin dashboard at `/admin` each morning. Check:

1. **Alerts section** — Red = failed pipelines, Yellow = stalled pipelines or stale agents. Click "View" to investigate.
2. **Review Queue** — Number of completed discoveries awaiting your review. Open `/admin/discoveries`, filter by "Complete", review meeting prep, generate proposals.
3. **Blog Pending** — Blog posts in "review" status needing approval. Open `/admin/content`.
4. **Social Drafts** — Social posts awaiting approval. Switch to Social Queue tab in `/admin/content`.
5. **Overdue Tasks** — Family tasks past due date. Open `/admin/family`.
6. **Unpaid Invoices** — Invoices in sent/overdue status. Open `/admin/finance`.

**Quick health check:** On `/admin/tola`, verify the system health pulse is green. If yellow/red, click individual agent nodes to diagnose.

## 2. Content Workflow

### Weekly Auto-Generation (Sunday 8am EST)
The content engine (`pipeline-content-engine`) automatically creates a new blog post every Sunday:

1. **Visionary** researches trending AI topics via web search
2. **Architect** creates an AEO-optimized outline
3. **Oracle** drafts the full 1,500-2,500 word post
4. **Guardian** reviews for quality and brand consistency
5. **Catalyst** generates social media variants
6. Post arrives in `/admin/content` with status "Needs Review"

### Human Review Process
1. Go to `/admin/content` → Blog Posts tab
2. Click the post with "Needs Review" badge
3. **Preview tab**: Read the full post
4. **Review tab**: Check Guardian's quality/SEO scores and any flagged issues
5. **Edit tab**: Make changes if needed (title, content)
6. **Social tab**: Review generated social variants
7. Click **"Approve & Publish"** to go live, or **"Reject to Draft"** for revisions

### On Publish
When you approve a post:
- JSON-LD schema is auto-generated
- Social variants move to the Social Queue as drafts
- A knowledge entry is auto-created in the Knowledge Base
- Blog listing page and sitemap are revalidated

### On-Demand Generation
Click **"Generate Blog Post"** in `/admin/content` to trigger the pipeline immediately (doesn't wait for Sunday).

## 3. Social Media

### Daily Auto-Generation (Mon-Fri 7am EST)
The social agent (`pipeline-social-agent`) checks the queue each weekday morning:

- If fewer than 3 approved posts exist for the next 3 days, it generates 2-3 new ones
- Posts are native-formatted per platform (LinkedIn hooks, Twitter 280 chars, Instagram captions, TikTok scripts, Threads conversational)
- Guardian reviews each post for brand consistency
- Posts arrive as "Draft" status

### Approval Workflow
1. Go to `/admin/content` → Social Queue tab
2. **List view**: See all posts with platform icons, status, content preview
3. **Bulk approve**: Check multiple drafts, click "Approve Selected"
4. **Individual review**: Click any post to see platform-specific preview mockup
5. **Edit**: Modify content inline, character counter warns at platform limits
6. **Schedule**: Use date picker to set a specific publish date
7. **Calendar view**: Toggle to see posts mapped to days

### On-Demand Generation
Click **"Generate Posts Now"** to trigger the social agent immediately.

## 4. Discovery Pipeline

### What Happens When a Form is Submitted
1. User fills out the 12-step discovery form at `/discover`
2. Record created in `discoveries` table with `pipeline_status = 'pending'`
3. Pipeline executes automatically via pg_cron (polls every 60s):

| Stage | Agent | Duration | Progress |
|-------|-------|----------|----------|
| Validation | Guardian | ~5s | 0→10% |
| Research | Visionary | ~60-90s | 15→35% |
| Assessment | Architect | ~60-90s | 40→65% |
| Synthesis | Oracle | ~60-90s | 70→100% |

**Expected total: 5-8 minutes** (including 60s cooldowns between Claude API calls)

4. On completion: a contact is auto-created (or updated) with `status = 'researched'`

### If a Pipeline Stalls
- After 30 minutes with no progress, the cron worker marks it "stalled" and sends an email alert
- Go to `/admin/discoveries`, find the stalled record
- Click **"Re-run Pipeline"** to reset and restart
- If it fails repeatedly, check the error message — usually 429 rate limits or API timeouts

### Rate Limiting
- Global 60-second cooldown between Claude API calls across ALL pipelines
- Auto-retry on 429/529/timeout errors (up to 5 attempts)
- If you see "Rate limited" errors, just wait — the system auto-recovers

## 5. Proposal Workflow

### Generate a Proposal
1. Open `/admin/discoveries` and find a completed discovery
2. Click **"Generate Proposal"** (only visible when pipeline_status = "complete")
3. Wait ~60-90 seconds for Claude to generate the SOW

### Review & Customize
1. Switch to the **Proposal** tab in the detail panel
2. Review the formatted markdown: Executive Summary, Findings, Solution, Timeline, Deliverables, Pricing
3. **Toggle pricing**: Flip the "Include pricing" switch to remove dollar amounts
4. **Edit & Regenerate**: Click to modify the prompt context, then regenerate with custom instructions

### Download & Send
1. Click **"Download as PDF"** — opens a print-friendly window
2. Use browser Print → Save as PDF
3. Update the contact status to "proposal_sent" in `/admin/contacts`

## 6. Family Hub

### Quick Capture
Type anything in the capture bar at the top of `/admin/family`:
- Text starting with "todo", "task", "remind", "need to", "should", "must", "don't forget" → creates a **task**
- Everything else → creates a **note** with context

### Task Management
- **Kanban board**: Drag tasks between To Do → In Progress → Done
- **Priority colors**: Gray=low, Blue=medium, Yellow=high, Red=urgent
- **Filter by person**: Click family member avatar pills
- **Add Task**: Set title, assign to person, priority, due date, context

### Events
- Add events with date, time, location
- Today's events appear in the banner at the top
- Overdue tasks also show in the Today banner

## 7. Knowledge Base

### Adding Entries
- **Quick Capture**: Click "Quick Capture" — paste text + select source tag. Title auto-generated.
- **Full Entry**: Click "Add Entry" for title, content, source, tags
- **Sources**: Meeting, Voice Memo, Article, Insight, Lesson, Discovery

### Auto-Ingestion
- **"Sync from Discoveries"**: Pulls research + assessment data from completed discovery pipelines
- **"Sync from Blog"**: Imports published blog posts as articles
- Both buttons are at the top of the Knowledge Base page
- Deduplicates automatically — safe to click repeatedly

### Search
Type in the search bar to find entries by title or content (text search). The pgvector embedding column is ready for semantic search when an embedding API is configured.

## 8. Project Management

### Logging Time
1. Click **"Log Time"** button (top-right of `/admin/projects`)
2. Select project, enter hours (0.25 increments), description, toggle billable
3. Time entries are visible in each project's detail panel

### Milestones
1. Click a project card to open details
2. Click **"Add Milestone"** — set title and due date
3. Click the checkbox to mark milestones complete
4. Project card shows progress bar (% milestones complete)

### Project Status
- **Active**: Currently in progress
- **Paused**: On hold
- **Completed**: Delivered
- Filter by status using the pills at the top

## 9. Invoicing

### Create an Invoice
1. Go to `/admin/finance`
2. Click **"Create Invoice"**
3. Enter client name, amount, description, due date
4. Invoice created with "Draft" status

### Invoice Lifecycle
- **Draft** → Click "Send" to mark as sent
- **Sent** → Click "Mark Paid" when payment received (auto-sets paid_date)
- **Overdue** → Same "Mark Paid" action when resolved

### Revenue Tracking
- **Revenue this month**: Sum of paid invoices in current month
- **Outstanding**: Sum of sent + overdue invoices
- **Hours Billed**: From project time entries where billable=true
- **Effective Rate**: Revenue ÷ hours billed

## 10. Troubleshooting

### Failed Pipeline
1. Check `/admin/discoveries` for records with red "Failed" badge
2. Read the error message (visible in the detail panel header)
3. Common errors:
   - **429/rate_limit**: Auto-retries up to 5x. Wait and it resolves.
   - **529/overloaded**: Same — Claude is busy. Auto-retries.
   - **ANTHROPIC_API_KEY**: Check Supabase Edge Function secrets
   - **Timeout**: Claude took too long. Re-run the pipeline.
4. Click **"Re-run Pipeline"** to reset and restart

### Stalled Pipeline
- Auto-detected after 30 minutes. Email alert sent.
- Check if the issue is a stuck pg_cron job or a silent Edge Function failure
- Re-run to clear the stall

### Agent Health
- Go to `/admin/tola` — click any agent with non-green status
- Check **Last Heartbeat** — "STALE" badge means >10 min since last activity
- Check **Recent Activity** for error patterns
- **Kill Switch**: Toggle to immediately disable a misbehaving agent
- **Manual Trigger**: Click to test if the agent's Edge Function responds

### Edge Function Issues
```bash
# Check deployment status
supabase functions list

# View live logs
supabase functions logs pipeline-guardian --follow

# Redeploy a function
supabase functions deploy pipeline-visionary --no-verify-jwt
```

### Database Issues
```bash
# Check migration status
supabase db push --dry-run

# Connect directly
supabase db remote commit
```

## 11. Monthly Review

### Metrics to Track
1. **Pipeline throughput**: Total discoveries processed, success rate, avg completion time
2. **Content output**: Blog posts published, social posts approved
3. **Revenue**: Monthly revenue, outstanding invoices, effective hourly rate
4. **Agent health**: Which agents are most active, error rates, latency trends
5. **Knowledge growth**: New entries added, sources diversifying

### What to Look For
- **Declining success rate**: Check for systematic errors in a specific pipeline stage
- **Increasing latency**: Claude API may be slower — check logs for timeout patterns
- **Stale agents**: Agents that haven't had a heartbeat in days may need their Edge Functions redeployed
- **Content quality**: Review Guardian scores — consistent low scores may need prompt tuning

### Optimization Actions
- Review and update Claude prompts in Edge Functions if content quality drops
- Add new content pillars if coverage becomes stale
- Archive completed projects and create new ones
- Update pricing defaults in `pipeline-proposal` if rates change
- Run "Sync from Discoveries" and "Sync from Blog" to keep the Knowledge Base current
