# TOLA Agent Collaboration Spec
# Place this in the repo root. Claude Code reads it as the build spec.

## Overview

This defines how the 11 TOLA agents communicate. Each path is a 
specific data contract — what leaves one agent and what the next 
agent expects to receive. The shared_context table holds all 
inter-agent communication. Nexus (the routing layer) decides 
which agents activate based on event type and previous agent outputs.

---

## Shared State: tola_shared_context

```sql
CREATE TABLE tola_shared_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL,        -- groups all agent work for one task
  pipeline_type TEXT NOT NULL,       -- 'discovery', 'content', 'nurture', 'health_check'
  from_agent TEXT NOT NULL,          -- 'visionary', 'architect', etc.
  to_agent TEXT NOT NULL,            -- intended recipient
  path_name TEXT NOT NULL,           -- e.g. 'visionary_to_architect'
  payload JSONB NOT NULL,            -- structured data per contract below
  status TEXT DEFAULT 'pending',     -- 'pending', 'read', 'acted_on'
  quality_score FLOAT,              -- Guardian sets this
  tier_level INTEGER DEFAULT 1,     -- 1=auto, 2=notify, 3=wait
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_context_pipeline ON tola_shared_context(pipeline_id);
CREATE INDEX idx_context_recipient ON tola_shared_context(to_agent, status);
```

Every agent READS from this table (filtering by to_agent = self 
and pipeline_id = current task) before doing its work. Every 
agent WRITES its output here for the next agent to read.

---

## The Discovery Pipeline Paths

### Path 1: Crown → Nexus (trigger)
**Event:** New discovery form submission (or Stripe webhook for $499)
**Payload:**
```json
{
  "discovery_id": "uuid",
  "contact_name": "John Proctor",
  "company": "Atlantic Laser Solutions",
  "email": "john@atlanticlaser.com",
  "pipeline_track": "paid_499" | "friends_family_zevgt3" | "free",
  "form_responses": { ... },
  "stripe_payment_id": "pi_xxx" | null
}
```
**Nexus decides:** Activate Guardian first for input validation.

### Path 2: Nexus → Guardian (input validation)
**Guardian receives:** The raw form submission
**Guardian does:** 
- Check for spam/bot indicators
- Validate email format
- Check for profanity or injection attempts  
- Assign initial risk tier
**Guardian writes:**
```json
{
  "validation": "pass" | "fail" | "flag",
  "risk_level": "low" | "medium" | "high",
  "flags": ["list of any concerns"],
  "recommendation": "proceed" | "review" | "reject"
}
```
**If pass → Nexus activates Visionary**
**If flag → Nexus escalates to Crown (Tier 3)**
**If fail → Nexus logs and stops**

### Path 3: Nexus → Visionary (research)
**Visionary receives:** Guardian's validated submission + form data
**Visionary does (REAL WORK, not placeholder):**
- Web search the company name → extract what they do, size, industry
- Visit their website URL (if provided) → read about page, products, team
- Search for the contact person on LinkedIn (by name + company)
- Search for recent news about the company
- Search for their competitors
- Search for industry trends affecting their business
- Check if they have existing AI/automation tools
- Estimate company revenue range from available signals
**Visionary writes:**
```json
{
  "company_profile": {
    "name": "Atlantic Laser Solutions",
    "industry": "Industrial equipment distribution",
    "estimated_revenue": "$500K-$1.5M",
    "employee_count": "5-15",
    "website_summary": "...",
    "products_services": ["laser engraving", "laser cleaning", "parts"],
    "key_differentiator": "New laser cleaning product line"
  },
  "contact_profile": {
    "name": "John Proctor",
    "role": "Owner/Founder",
    "linkedin_summary": "...",
    "communication_style_signals": "..."
  },
  "competitive_landscape": {
    "competitors": ["Company A", "Company B"],
    "market_position": "..."
  },
  "industry_trends": ["trend 1", "trend 2"],
  "existing_tech_stack": ["website platform", "CRM if detectable"],
  "ai_opportunity_signals": ["signal 1", "signal 2"],
  "research_confidence": "high" | "medium" | "low",
  "sources_consulted": 8,
  "raw_sources": ["url1", "url2"]
}
```
**On completion → Nexus activates Architect**

### Path 4: Visionary → Architect (via Nexus routing)
**Architect receives:** Visionary's full research output + original form data
**Architect does:**
- Map the company's pain points (from form) to AI solutions
- For each opportunity: assess feasibility, estimated effort, expected impact
- Identify constraints (budget signals, team size, technical readiness)
- Determine which Zev.AI service tier fits best
- Create a realistic scope with honest tradeoffs
- Flag anything that feels like a poor fit (honesty builds trust)
**Architect writes:**
```json
{
  "opportunities": [
    {
      "name": "Lead generation automation",
      "pain_point_addressed": "Spending $60K/yr on Google Ads with poor ROI",
      "proposed_solution": "Owned lead pipeline with AI qualification",
      "feasibility": "high",
      "estimated_effort": "4-6 weeks",
      "expected_impact": "Reduce ad spend 40%, increase qualified leads 2x",
      "honest_caveat": "Requires consistent content investment for 3-6 months before SEO impact"
    }
  ],
  "recommended_tier": "build",
  "recommended_scope": {
    "phase_1": "...",
    "phase_2": "...",
    "estimated_total_investment": "$15,000-$25,000"
  },
  "constraints_identified": [
    "Small team may struggle with adoption",
    "Current website needs modernization first"
  ],
  "fit_assessment": "strong" | "moderate" | "weak",
  "fit_reasoning": "...",
  "decision_forks": [
    {
      "fork": "Build custom CRM vs. use existing tools",
      "option_a": "Custom: $X, full control, 6-week build",
      "option_b": "Existing: $Y/mo, faster start, less customization",
      "recommendation": "..."
    }
  ]
}
```
**On completion → Nexus activates Oracle**

### Path 5: Architect → Oracle (via Nexus routing)
**Oracle receives:** Visionary's research + Architect's scope + form data
**Oracle does:**
- Synthesize everything into a coherent narrative
- Write the actual insight report content (executive summary, opportunities, 
  recommendations, decision forks, next steps)
- Ensure the tone is direct, honest, and valuable — "here's what I'd actually do"
- Include specific numbers and timelines, not vague promises
- Generate the personalized report page content
**Oracle writes:**
```json
{
  "report": {
    "executive_summary": "3-4 sentences, sharp, specific to this business",
    "key_findings": ["finding 1 with specifics", "finding 2"],
    "opportunities": [
      {
        "title": "...",
        "description": "...",
        "expected_impact": "...",
        "honest_assessment": "...",
        "what_i_would_do": "..."
      }
    ],
    "decision_forks": [
      {
        "question": "...",
        "options": ["..."],
        "my_recommendation": "...",
        "why": "..."
      }
    ],
    "next_steps": "...",
    "fit_for_zev_ai": "strong" | "moderate" | "exploratory"
  },
  "delivery_ready": true,
  "synthesis_confidence": "high" | "medium" | "low"
}
```
**On completion → Nexus activates Guardian for quality review**

### Path 6: Oracle → Guardian (quality gate)
**Guardian receives:** Oracle's complete report
**Guardian evaluates (REAL criteria, not rubber stamp):**
- Does the executive summary mention the company by name and their specific situation?
- Are the opportunities specific (numbers, timelines) or vague ("improve efficiency")?
- Do the decision forks present genuine tradeoffs, not obvious choices?
- Is the honest assessment actually honest, or just cheerleading?
- Would a business owner pay $499 for this and feel it was worth it?
- Grammar, formatting, professionalism
- Any hallucinated facts? (Cross-reference against Visionary's sources)
**Guardian writes:**
```json
{
  "quality_score": 0.85,
  "pass_threshold": 0.80,
  "verdict": "pass" | "fail" | "needs_revision",
  "issues": [
    {
      "severity": "minor",
      "location": "opportunity_2",
      "issue": "Impact estimate seems inflated",
      "suggested_fix": "..."
    }
  ],
  "revision_instructions": "..." | null
}
```
**If pass AND paid_499 track → Gateway auto-delivers report via email**
**If pass AND zevgt3 track → Nexus flags as Tier 3 for Crown review**
**If fail → Nexus sends Oracle's report back through revision loop (max 2 iterations)**
**If fail after 2 revisions → Tier 3 escalation to Crown**

### Path 7: Guardian → Gateway (delivery)
**Gateway receives:** Approved report
**Gateway does:**
- Generate/update the personalized report page at /discovery/[id]
- Send delivery email via Resend from hello@askzev.ai
- Include link to report page
- Track open/click events
- Log delivery to tola_agent_log
**Gateway writes:**
```json
{
  "delivered": true,
  "delivery_method": "email",
  "report_url": "https://askzev.ai/discovery/abc123",
  "email_sent_to": "john@atlanticlaser.com",
  "delivered_at": "2026-03-24T14:30:00Z"
}
```

### Path 8: Gateway → Crown (notification)
**Crown (via Cain on Telegram) receives:**
"✅ Insight Report delivered to John Proctor at Atlantic Laser Solutions. 
Revenue: $499. Report: https://askzev.ai/discovery/abc123. 
Fit assessment: strong. Recommended tier: Build ($15-25K)."

---

## The Content Pipeline Paths

### Path 9: Nexus → Visionary (content research)
**Trigger:** Weekly cron (Sunday 8am)
**Visionary does:** Research trending topics in AI consulting, check what 
competitors published this week, analyze which existing blog posts get 
traffic, identify content gaps
**Writes:** Topic recommendations with keyword targets and angles

### Path 10: Visionary → Architect (content planning)
**Architect does:** Select 2-3 topics, structure each as an outline with 
AEO-optimized headers (question format), assign content pillars, 
determine word count targets
**Writes:** Structured outlines

### Path 11: Architect → Oracle (content drafting)
**Oracle does:** Write the actual blog post content based on Architect's outline
**Writes:** Full draft with JSON-LD schema, meta description, FAQ section

### Path 12: Oracle → Guardian (content quality gate)
**Guardian does:** Check for AI-sounding language, verify claims, 
ensure AEO headers are question-format, check readability
**Writes:** Pass/fail with revision notes

### Path 13: Guardian → Catalyst (social distribution)
**Catalyst does:** Generate platform-specific variants — LinkedIn post, 
Twitter thread, Instagram caption — from approved blog content
**Writes:** Platform-specific drafts to social_queue table

### Path 14: Catalyst → Crown (approval queue)
**Tier 2 or 3:** Content drafts presented to Zev (via Telegram through Cain) 
for approval before publishing

---

## The Monitoring Paths

### Path 15: Sentinel → Nexus (health alerts)
**Trigger:** Every 60 seconds
**Sentinel checks:** All Edge Function health, Supabase connectivity, 
Vercel uptime, API response times, agent last-heartbeat times
**Writes:** Health status. Only alerts Nexus if something is degraded.

### Path 16: Nexus → Crown (critical alert)
**Trigger:** Sentinel reports degraded or critical status
**Nexus escalates:** Pushes alert to Telegram with context and 
suggested action

### Path 17: Prism → Oracle (quality metrics)
**Trigger:** After every agent response delivered to a user
**Prism evaluates:** Response quality, relevance, tone
**Writes:** Score + feedback to Oracle's lessons log

### Path 18: Oracle → All (lessons broadcast)
**Trigger:** Daily synthesis
**Oracle does:** Reviews all Prism feedback, all Guardian rejections, 
all pipeline failures. Synthesizes patterns. Updates system prompts 
if patterns indicate consistent issues.
**Writes:** Daily lessons summary to shared context

---

## The Nurture Paths

### Path 19: Catalyst → Crown (follow-up reminders)
**Trigger:** Time-based — checks contact last-interaction dates
**Catalyst flags:** "John Proctor received his insight report 3 days ago. 
No response yet. Suggest follow-up?"

### Path 20: Crown → Catalyst (approved follow-up)
**Zev approves** → Catalyst sends the follow-up email or queues it

### Path 21: Gateway → Catalyst (engagement signals)
**Trigger:** Someone revisits their report page, clicks pricing, 
visits /discover again
**Gateway notifies Catalyst:** "John Proctor viewed his report page 
again at 2pm. Third visit this week."
**Catalyst escalates to Crown:** "Hot signal — John is re-reading 
his report. Want to reach out?"

### Path 22: Foundation → Sentinel (infrastructure health)
**Trigger:** Daily maintenance
**Foundation reports:** Database size, backup status, cron job 
success rates, token spend by agent, storage usage
**Sentinel incorporates** into health dashboard

---

## Tier Enforcement

Every agent checks the tier level before acting:

**Before auto-delivering a report:**
- Is pipeline_track = "paid_499"? → Tier 1, deliver
- Is pipeline_track = "friends_family_zevgt3"? → Tier 3, wait for Crown
- Is quality_score < threshold? → Tier 3, wait for Crown

**Before sending any email:**
- Is it a system notification? → Tier 1, send
- Is it client-facing? → Tier 3, wait for Crown

**Before publishing social content:**
- Is it from an approved template? → Tier 2, post and notify
- Is it new/custom content? → Tier 3, wait for Crown

---

## Implementation Notes for Claude Code

- Use Supabase Edge Functions for each agent
- Use pg_cron for scheduled triggers
- Use Supabase Realtime subscriptions for event-driven triggers
- The shared_context table is the communication backbone — agents 
  poll it or subscribe to changes
- Each agent's Edge Function reads from shared_context WHERE 
  to_agent = self AND pipeline_id = current AND status = 'pending'
- After processing, agent updates status to 'acted_on' and writes 
  its own output as a new row with to_agent = next_agent
- Nexus can be implemented as a routing function that triggers 
  on shared_context inserts and decides what happens next
- Guardian quality gate MUST be a real evaluation, not a 
  rubber stamp that always passes
- Visionary MUST make real web searches via Claude API with 
  web search tool enabled, not just generate text from training data
