// =============================================================================
// TOLA v3.0 — Agent Types, Constants, and Tree of Life Layout
// =============================================================================

// ---------------------------------------------------------------------------
// Primitive types
// ---------------------------------------------------------------------------

export type AgentStatus = 'healthy' | 'degraded' | 'critical' | 'offline';

export type GeometryEngine =
  | 'seed_of_life'
  | 'metatrons_cube'
  | 'sri_yantra'
  | 'torus'
  | 'lotus'
  | 'yin_yang'
  | 'flower_of_life'
  | 'merkabah'
  | 'vortex';

export type AgentId =
  | 'crown'
  | 'visionary'
  | 'architect'
  | 'oracle'
  | 'catalyst'
  | 'guardian'
  | 'nexus'
  | 'sentinel'
  | 'prism'
  | 'foundation'
  | 'gateway';

// ---------------------------------------------------------------------------
// Database-mapped interfaces
// ---------------------------------------------------------------------------

export interface TolaAgent {
  id: AgentId;
  node_name: string;
  geometry_engine: GeometryEngine;
  display_name: string;
  description: string | null;
  status: AgentStatus;
  tier: 1 | 2 | 3;
  last_heartbeat: string | null;
  config: Record<string, unknown>;
  is_active: boolean;
  kill_switch: boolean;
  created_at: string;
  updated_at: string;
}

export interface TolaAgentLog {
  id: string;
  agent_id: AgentId | null;
  action: string;
  geometry_pattern: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  confidence: number | null;
  tier_used: number | null;
  tokens_used: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface TolaAgentMetric {
  id: string;
  agent_id: AgentId | null;
  metric: string;
  value: number;
  geometry_state: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Canonical Tree of Life node data
// Positions normalized to viewBox 0 0 500 700 (5:7 portrait ratio)
// Left pillar x=110, center x=250, right pillar x=390.
// The Tree of Life is a universal sacred geometry structure found across
// Egyptian, Hindu, Celtic, Greek, Buddhist, and indigenous traditions.
// ---------------------------------------------------------------------------

export interface TreeNode {
  id: AgentId;
  name: string;
  engine: GeometryEngine;
  description: string;
  technicalEquivalent: string;
  tier: 1 | 2 | 3;
  x: number;
  y: number;
  phantom: boolean;
}

export const TREE_NODES: TreeNode[] = [
  // viewBox 0 0 500 700. Pillars: left x=110, center x=250, right x=390.
  // Node radii: standard 28, Nexus 36, Oracle 24.
  { id: 'crown',      name: 'Crown',      engine: 'seed_of_life',   description: 'Human decision authority — admin dashboard and approval queue',                  technicalEquivalent: 'Hub-and-Spoke / Fan-Out',                tier: 3, x: 250, y: 50,  phantom: false },
  { id: 'architect',  name: 'Architect',  engine: 'sri_yantra',     description: 'Constraint-based planning — pattern analysis and engagement scoping',             technicalEquivalent: 'Constraint Satisfaction / SAT Solver',   tier: 1, x: 110, y: 125, phantom: false },
  { id: 'visionary',  name: 'Visionary',  engine: 'metatrons_cube', description: 'Multi-source research engine — 13-dimension prospect analysis',                  technicalEquivalent: 'Complete Graph / All-to-All',            tier: 1, x: 390, y: 125, phantom: false },
  { id: 'oracle',     name: 'Oracle',     engine: 'torus',          description: 'Iterative synthesis — knowledge base and consulting methodology',                 technicalEquivalent: 'Iterative Refinement Loop',             tier: 1, x: 250, y: 200, phantom: true },
  { id: 'guardian',   name: 'Guardian',   engine: 'yin_yang',       description: 'Adversarial quality review — input validation and brand enforcement',             technicalEquivalent: 'Adversarial Debate / Red Team-Blue Team', tier: 1, x: 110, y: 275, phantom: false },
  { id: 'catalyst',   name: 'Catalyst',   engine: 'lotus',          description: 'Progressive engagement — nurture sequences and relationship building',            technicalEquivalent: 'Sequential Pipeline / Progressive Disclosure', tier: 1, x: 390, y: 275, phantom: false },
  { id: 'nexus',      name: 'Nexus',      engine: 'flower_of_life', description: 'Intelligent routing — inquiry classification and workflow orchestration',         technicalEquivalent: 'Weighted Graph Router / Load Balancer',  tier: 1, x: 250, y: 350, phantom: false },
  { id: 'prism',      name: 'Prism',      engine: 'vortex',         description: 'Recursive quality refinement — content scoring and spiral testing',               technicalEquivalent: 'Recursive Refinement / Funnel Testing', tier: 1, x: 110, y: 425, phantom: false },
  { id: 'sentinel',   name: 'Sentinel',   engine: 'merkabah',       description: 'Triangulated health monitoring — API, database, and application verification',    technicalEquivalent: 'Dual-Team Verification / N-Version Programming', tier: 1, x: 390, y: 425, phantom: false },
  { id: 'foundation', name: 'Foundation', engine: 'seed_of_life',   description: 'Infrastructure maintenance — database health, log cleanup, metric aggregation',   technicalEquivalent: 'Hub-and-Spoke / Fan-Out',               tier: 1, x: 250, y: 500, phantom: false },
  { id: 'gateway',    name: 'Gateway',    engine: 'flower_of_life', description: 'The application itself — user interface and interconnected page delivery',        technicalEquivalent: 'Weighted Graph Router / Load Balancer',  tier: 1, x: 250, y: 650, phantom: false },
];

export const TREE_NODE_MAP: Record<AgentId, TreeNode> =
  Object.fromEntries(TREE_NODES.map((n) => [n.id, n])) as Record<AgentId, TreeNode>;

// ---------------------------------------------------------------------------
// The 22 Paths — traditional Tree of Life topology
// Each path is a defined connection between two agents.
// Paths touching Oracle are "phantom" (rendered dashed/translucent).
// ---------------------------------------------------------------------------

export interface TreePath {
  source: AgentId;
  target: AgentId;
  phantom: boolean;
}

export const TREE_PATHS: TreePath[] = [
  // Middle pillar (vertical)
  { source: 'crown',      target: 'oracle',      phantom: true  },  //  1
  { source: 'oracle',     target: 'nexus',       phantom: true  },  //  2
  { source: 'nexus',      target: 'foundation', phantom: false },  //  3
  // Left pillar (vertical)
  { source: 'architect',  target: 'guardian',    phantom: false },  //  5
  { source: 'guardian',   target: 'prism',       phantom: false },  //  6
  // Right pillar (vertical)
  { source: 'visionary',  target: 'catalyst',    phantom: false },  //  7
  { source: 'catalyst',   target: 'sentinel',   phantom: false },  //  8
  // Horizontal
  { source: 'architect',  target: 'visionary',   phantom: false },  //  9
  { source: 'guardian',   target: 'catalyst',    phantom: false },  // 10
  { source: 'prism',      target: 'sentinel',   phantom: false },  // 11
  // Diagonal
  { source: 'crown',      target: 'architect',   phantom: false },  // 12
  { source: 'crown',      target: 'visionary',   phantom: false },  // 13
  { source: 'architect',  target: 'oracle',      phantom: true  },  // 14
  { source: 'visionary',  target: 'oracle',      phantom: true  },  // 15
  { source: 'architect',  target: 'nexus',       phantom: false },  // 16
  { source: 'visionary',  target: 'nexus',       phantom: false },  // 17
  { source: 'guardian',   target: 'nexus',       phantom: false },  // 18
  { source: 'catalyst',   target: 'nexus',       phantom: false },  // 19
  { source: 'nexus',      target: 'prism',       phantom: false },  // 20
  { source: 'nexus',      target: 'sentinel',   phantom: false },  // 21
  { source: 'foundation', target: 'gateway',    phantom: false },  // 22 (reinforced middle pillar)
];

// Backward compat: admin components may reference this
export const TREE_OF_LIFE_EDGES = TREE_PATHS;

// ---------------------------------------------------------------------------
// Legacy static agent data (used by admin components during migration)
// ---------------------------------------------------------------------------

export interface TolaAgentStatic {
  id: AgentId;
  node_name: string;
  geometry_engine: GeometryEngine;
  display_name: string;
  description: string;
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
}

export const TOLA_AGENTS: TolaAgentStatic[] = TREE_NODES.map((n) => ({
  id: n.id,
  node_name: n.name,
  geometry_engine: n.engine,
  display_name: n.name,
  description: n.description,
  tier: n.tier,
  position: { x: n.x, y: n.y },
}));

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const HEALTH_COLORS: Record<string, string> = {
  healthy:  '#4ade80',
  active:   '#7c9bf5',
  degraded: '#f59e0b',
  critical: '#ef4444',
  offline:  '#6b7280',
};

// Backward compat
export const STATUS_COLORS: Record<AgentStatus, string> = {
  healthy:  '#4ade80',
  degraded: '#f59e0b',
  critical: '#ef4444',
  offline:  '#6b7280',
};

export const GEOMETRY_LABELS: Record<GeometryEngine, string> = {
  seed_of_life:   'Seed of Life',
  metatrons_cube: "Metatron's Cube",
  sri_yantra:     'Sri Yantra',
  torus:          'Torus',
  lotus:          'Lotus',
  yin_yang:       'Yin Yang',
  flower_of_life: 'Flower of Life',
  merkabah:       'Merkabah',
  vortex:         'Vortex',
};

// ---------------------------------------------------------------------------
// Technical equivalents for the /tola page jargon mapping
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Agent operational details — actions, interactions, schedule, cost
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Triads — sets of 3 agents that commonly work together
// ---------------------------------------------------------------------------

export interface Triad {
  id: string;
  name: string;
  agents: [AgentId, AgentId, AgentId];
  description: string;
  color: string;
}

export const TRIADS: Triad[] = [
  {
    id: 'assessment',
    name: 'Assessment Triad',
    agents: ['guardian', 'visionary', 'architect'],
    description: 'Validates, researches, and scopes every inbound discovery',
    color: '#7c9bf5',
  },
  {
    id: 'content',
    name: 'Content Triad',
    agents: ['visionary', 'oracle', 'catalyst'],
    description: 'Researches, synthesizes, and distributes content across channels',
    color: '#c4b5e0',
  },
  {
    id: 'quality',
    name: 'Quality Triad',
    agents: ['guardian', 'prism', 'nexus'],
    description: 'Validates outputs, audits quality, and routes health status',
    color: '#4ade80',
  },
  {
    id: 'operations',
    name: 'Operations Triad',
    agents: ['nexus', 'foundation', 'sentinel'],
    description: 'Monitors system health, maintains infrastructure, and verifies uptime',
    color: '#f59e0b',
  },
];

export type CommunicationDirection = 'sends' | 'receives' | 'bidirectional';

export const AGENT_DETAILS: Record<AgentId, {
  actions: string[];
  interactsWith: AgentId[];
  communicationDirection: Partial<Record<AgentId, CommunicationDirection>>;
  triads: string[];
  schedule: string;
  costPerDay: { low: string; medium: string; high: string };
  fullDescription: string;
}> = {
  crown: {
    actions: ['governance-scan', 'token-spend-tracking', 'tier-3-queue-scan', 'failure-scan', 'daily-governance-digest'],
    interactsWith: ['nexus', 'guardian', 'visionary', 'architect', 'oracle'],
    communicationDirection: {
      nexus: 'receives',
      guardian: 'receives',
      visionary: 'sends',
      architect: 'sends',
      oracle: 'receives',
    },
    triads: [],
    schedule: 'Every 2h (medium) / 2x daily (low)',
    costPerDay: { low: '$0.002', medium: '$0.01', high: '$0.04' },
    fullDescription: 'Governance and oversight. Tracks token spend across all agents, monitors the Tier 3 approval queue for discoveries needing human review, counts failed/stalled pipelines, and generates a daily governance digest stored in the knowledge base.',
  },
  visionary: {
    actions: ['13-dimension-research', 'web-search', 'competitive-analysis', 'trend-identification', 'topic-research'],
    interactsWith: ['guardian', 'architect', 'oracle', 'nexus'],
    communicationDirection: {
      guardian: 'receives',
      architect: 'sends',
      oracle: 'sends',
      nexus: 'bidirectional',
    },
    triads: ['assessment', 'content'],
    schedule: 'On-demand (pipeline trigger)',
    costPerDay: { low: '$0.02/run', medium: '$0.05/run', high: '$0.05/run' },
    fullDescription: 'Multi-source research engine. Performs 13-dimension analysis of prospects using Claude + web_search tool. Covers company overview, industry, pain points, competitors, AI readiness, budget signals, and decision-maker profiles. Activates during assessment pipeline (Guardian → Visionary).',
  },
  architect: {
    actions: ['9-constraint-scoping', 'system-design', 'timeline-estimation', 'risk-assessment', 'deliverable-planning'],
    interactsWith: ['visionary', 'oracle', 'guardian', 'nexus'],
    communicationDirection: {
      visionary: 'receives',
      oracle: 'sends',
      guardian: 'bidirectional',
      nexus: 'bidirectional',
    },
    triads: ['assessment'],
    schedule: 'On-demand (pipeline trigger)',
    costPerDay: { low: '$0.02/run', medium: '$0.05/run', high: '$0.05/run' },
    fullDescription: 'Constraint-based planning. Takes Visionary research and scopes engagements across 9 constraints: technical complexity, timeline, budget, team readiness, data availability, integration depth, compliance, risk, and ROI potential. Produces structured assessment documents.',
  },
  oracle: {
    actions: ['meeting-prep-synthesis', 'knowledge-aggregation', 'insight-generation', 'cross-reference-analysis'],
    interactsWith: ['visionary', 'architect', 'crown', 'nexus'],
    communicationDirection: {
      visionary: 'receives',
      architect: 'receives',
      crown: 'sends',
      nexus: 'bidirectional',
      catalyst: 'sends',
    },
    triads: ['content'],
    schedule: 'On-demand (pipeline trigger)',
    costPerDay: { low: '$0.02/run', medium: '$0.05/run', high: '$0.05/run' },
    fullDescription: 'Synthesis and knowledge. Combines Visionary research and Architect assessment into actionable meeting prep documents. Manages the knowledge base with semantic search (pgvector). Phantom node — operates as the bridge between research and action.',
  },
  guardian: {
    actions: ['safety-scan', 'anomaly-detection', 'token-spike-detection', 'latency-monitoring', 'circuit-breaker', 'form-validation', 'brand-enforcement'],
    interactsWith: ['nexus', 'crown', 'prism', 'catalyst'],
    communicationDirection: {
      nexus: 'sends',
      crown: 'sends',
      prism: 'bidirectional',
      catalyst: 'receives',
      visionary: 'sends',
      architect: 'bidirectional',
    },
    triads: ['assessment', 'quality'],
    schedule: 'Every 30min (medium) / Every 2h (low)',
    costPerDay: { low: '$0.001', medium: '$0.005', high: '$0.02' },
    fullDescription: 'Safety and validation. Scans all agent logs for anomalies — token spikes (>100K), latency anomalies (>5 min), error patterns. Implements circuit breaker: 10 errors in 1 hour auto-kills the failing agent. Also validates discovery form inputs and enforces brand consistency in content.',
  },
  catalyst: {
    actions: ['velocity-analysis', 'bottleneck-detection', 'pipeline-duration-tracking', 'trend-comparison', 'retry-frequency-monitoring', 'social-content-generation'],
    interactsWith: ['guardian', 'nexus', 'visionary', 'architect', 'oracle'],
    communicationDirection: {
      guardian: 'sends',
      nexus: 'sends',
      visionary: 'receives',
      architect: 'receives',
      oracle: 'receives',
    },
    triads: ['content'],
    schedule: 'Every 4h (medium) / Daily (low)',
    costPerDay: { low: '$0.001', medium: '$0.005', high: '$0.02' },
    fullDescription: 'Engagement and optimization. Analyzes pipeline velocity — avg duration, per-stage latency, bottleneck identification, retry frequency. Compares recent vs. historical trends. Also drives social content generation and distribution cadence.',
  },
  nexus: {
    actions: ['health-check', 'health-scoring', 'path-activity-aggregation', 'status-flagging', 'degraded-detection'],
    interactsWith: ['crown', 'guardian', 'visionary', 'architect', 'oracle', 'catalyst', 'prism', 'sentinel', 'foundation', 'gateway'],
    communicationDirection: {
      crown: 'sends',
      guardian: 'receives',
      visionary: 'bidirectional',
      architect: 'bidirectional',
      oracle: 'bidirectional',
      catalyst: 'receives',
      prism: 'sends',
      sentinel: 'sends',
      foundation: 'sends',
      gateway: 'sends',
    },
    triads: ['quality', 'operations'],
    schedule: 'Every 30min (medium) / Every 2h (low)',
    costPerDay: { low: '$0.001', medium: '$0.005', high: '$0.02' },
    fullDescription: 'Central routing and health monitoring. Health-checks all 11 agents by measuring heartbeat freshness and error rates. Computes health scores (0-100) and flags degraded agents. Aggregates path activity between agent pairs for the Tree of Life visualization.',
  },
  sentinel: {
    actions: ['system-monitoring', 'api-verification', 'database-checks', 'uptime-tracking'],
    interactsWith: ['nexus', 'prism', 'guardian'],
    communicationDirection: {
      nexus: 'receives',
      prism: 'bidirectional',
      guardian: 'sends',
    },
    triads: ['operations'],
    schedule: 'Via tola-agent (legacy)',
    costPerDay: { low: '$0', medium: '$0', high: '$0.01' },
    fullDescription: 'Health monitoring agent. Verifies API availability, database connectivity, and system uptime. Works through the legacy tola-agent Edge Function. Provides redundant verification alongside Prism.',
  },
  prism: {
    actions: ['quality-check', 'synthetic-health-checks', 'page-response-monitoring', 'agent-output-audit', 'daily-quality-report'],
    interactsWith: ['nexus', 'guardian', 'gateway'],
    communicationDirection: {
      nexus: 'receives',
      guardian: 'bidirectional',
      gateway: 'receives',
      sentinel: 'bidirectional',
    },
    triads: ['quality'],
    schedule: 'Every 6h (medium) / Daily (low)',
    costPerDay: { low: '$0.001', medium: '$0.003', high: '$0.01' },
    fullDescription: 'Quality assurance. Runs synthetic health checks on 5 public pages (/, /discover, /blog, /approach, /services) with 10s timeout. Audits recent agent outputs for token/latency anomalies. Generates daily quality reports stored in the knowledge base.',
  },
  foundation: {
    actions: ['maintenance-run', 'table-row-counting', 'metrics-archival', 'log-archival', 'path-activity-cleanup', 'daily-infrastructure-report'],
    interactsWith: ['nexus'],
    communicationDirection: {
      nexus: 'sends',
    },
    triads: ['operations'],
    schedule: 'Every 12h (medium) / Daily (low)',
    costPerDay: { low: '$0.001', medium: '$0.002', high: '$0.005' },
    fullDescription: 'Infrastructure maintenance. Counts rows across 8 core tables (logs, metrics, paths, discoveries, contacts, blog, social, knowledge). Archives old data: metrics >30 days, path activity >7 days, logs >30 days. Generates daily infrastructure reports.',
  },
  gateway: {
    actions: ['seo-check', 'sitemap-validation', 'robots-txt-validation', 'rss-feed-validation', 'ai-crawler-verification', 'page-count-tracking'],
    interactsWith: ['nexus', 'prism'],
    communicationDirection: {
      nexus: 'receives',
      prism: 'sends',
    },
    triads: [],
    schedule: 'Every 6h (medium) / Daily (low)',
    costPerDay: { low: '$0.001', medium: '$0.003', high: '$0.01' },
    fullDescription: 'SEO and application health. Validates sitemap.xml structure and URL count, robots.txt directives (GPTBot, ClaudeBot, PerplexityBot allowed), RSS feed format. Tracks total page count (static + published blog posts). Independent monitoring of public-facing infrastructure.',
  },
};

export const ENGINE_TECHNICAL_MAP: Array<{
  engine: GeometryEngine;
  label: string;
  technical: string;
  whatItDoes: string;
  commonIn: string;
}> = [
  { engine: 'seed_of_life',   label: 'Seed of Life',    technical: 'Hub-and-Spoke / Fan-Out',                    whatItDoes: 'Spawns parallel specialist tasks from a central coordinator',                       commonIn: 'MapReduce, microservice orchestration' },
  { engine: 'metatrons_cube', label: "Metatron's Cube",  technical: 'Complete Graph / All-to-All',                whatItDoes: 'Exhaustive parallel research across all information sources',                       commonIn: 'Ensemble methods, multi-source data fusion' },
  { engine: 'sri_yantra',     label: 'Sri Yantra',       technical: 'Constraint Satisfaction / SAT Solver',       whatItDoes: 'Plans complex systems where every decision affects others',                         commonIn: 'Architecture planning, scheduling, optimization' },
  { engine: 'torus',          label: 'Torus',            technical: 'Iterative Refinement Loop',                  whatItDoes: 'Cycles through analyze, synthesize, evaluate until convergence',                    commonIn: 'Gradient descent, RLHF, continuous improvement' },
  { engine: 'lotus',          label: 'Lotus',            technical: 'Sequential Pipeline / Progressive Disclosure', whatItDoes: 'Builds layered experiences where each stage gates the next',                       commonIn: 'Onboarding flows, CI/CD pipelines, progressive enhancement' },
  { engine: 'yin_yang',       label: 'Yin Yang',         technical: 'Adversarial Debate / Red Team-Blue Team',    whatItDoes: 'Generates opposing arguments and synthesizes balanced judgment',                    commonIn: 'Constitutional AI, adversarial validation, compliance review' },
  { engine: 'flower_of_life', label: 'Flower of Life',   technical: 'Weighted Graph Router / Load Balancer',      whatItDoes: 'Routes messages through optimal paths with health-aware selection',                 commonIn: 'API gateways, service mesh, message queues' },
  { engine: 'merkabah',       label: 'Merkabah',         technical: 'Dual-Team Verification / N-Version Programming', whatItDoes: 'Two independent teams evaluate the same input, consensus required',            commonIn: 'Safety-critical systems, financial auditing, redundant verification' },
  { engine: 'vortex',         label: 'Vortex',           technical: 'Recursive Refinement / Funnel Testing',      whatItDoes: 'Spirals inward with increasingly strict criteria each pass',                        commonIn: 'QA pipelines, search refinement, anomaly detection' },
];
