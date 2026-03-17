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
// Positions normalized to viewBox 0 0 400 600 (2:3 portrait ratio)
// Left pillar x=100 (25%), center x=200 (50%), right pillar x=300 (75%).
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
  // Crown — 7% height
  { id: 'crown',      name: 'Crown',      engine: 'seed_of_life',   description: 'Human decision authority — admin dashboard and approval queue',                  technicalEquivalent: 'Hub-and-Spoke / Fan-Out',                tier: 3, x: 200, y: 42,  phantom: false },
  // Supernal pair — 22% height
  { id: 'architect',  name: 'Architect',  engine: 'sri_yantra',     description: 'Constraint-based planning — pattern analysis and engagement scoping',             technicalEquivalent: 'Constraint Satisfaction / SAT Solver',   tier: 1, x: 100, y: 132, phantom: false },
  { id: 'visionary',  name: 'Visionary',  engine: 'metatrons_cube', description: 'Multi-source research engine — 13-dimension prospect analysis',                  technicalEquivalent: 'Complete Graph / All-to-All',            tier: 1, x: 300, y: 132, phantom: false },
  // Oracle — phantom node — 35% height
  { id: 'oracle',     name: 'Oracle',     engine: 'torus',          description: 'Iterative synthesis — knowledge base and consulting methodology',                 technicalEquivalent: 'Iterative Refinement Loop',             tier: 1, x: 200, y: 210, phantom: true },
  // Central triad — 52% height (Nexus at 54%, slightly lower)
  { id: 'guardian',   name: 'Guardian',   engine: 'yin_yang',       description: 'Adversarial quality review — input validation and brand enforcement',             technicalEquivalent: 'Adversarial Debate / Red Team-Blue Team', tier: 1, x: 100, y: 312, phantom: false },
  { id: 'nexus',      name: 'Nexus',      engine: 'flower_of_life', description: 'Intelligent routing — inquiry classification and workflow orchestration',         technicalEquivalent: 'Weighted Graph Router / Load Balancer',  tier: 1, x: 200, y: 324, phantom: false },
  { id: 'catalyst',   name: 'Catalyst',   engine: 'lotus',          description: 'Progressive engagement — nurture sequences and relationship building',            technicalEquivalent: 'Sequential Pipeline / Progressive Disclosure', tier: 1, x: 300, y: 312, phantom: false },
  // Lower pair — 70% height
  { id: 'prism',      name: 'Prism',      engine: 'vortex',         description: 'Recursive quality refinement — content scoring and spiral testing',               technicalEquivalent: 'Recursive Refinement / Funnel Testing', tier: 1, x: 100, y: 420, phantom: false },
  { id: 'sentinel',   name: 'Sentinel',   engine: 'merkabah',       description: 'Triangulated health monitoring — API, database, and application verification',    technicalEquivalent: 'Dual-Team Verification / N-Version Programming', tier: 1, x: 300, y: 420, phantom: false },
  // Foundation — 83% height
  { id: 'foundation', name: 'Foundation', engine: 'seed_of_life',   description: 'Infrastructure maintenance — database health, log cleanup, metric aggregation',   technicalEquivalent: 'Hub-and-Spoke / Fan-Out',               tier: 1, x: 200, y: 498, phantom: false },
  // Gateway — 95% height
  { id: 'gateway',    name: 'Gateway',    engine: 'flower_of_life', description: 'The application itself — user interface and interconnected page delivery',        technicalEquivalent: 'Weighted Graph Router / Load Balancer',  tier: 1, x: 200, y: 570, phantom: false },
];

export const TREE_NODE_MAP: Record<AgentId, TreeNode> =
  Object.fromEntries(TREE_NODES.map((n) => [n.id, n])) as Record<AgentId, TreeNode>;

// ---------------------------------------------------------------------------
// The 22 Paths — exactly 22 structured communication channels
// Each path is a defined connection between two agents.
// Paths touching Oracle are "phantom" (rendered dashed/translucent).
// ---------------------------------------------------------------------------

export interface TreePath {
  source: AgentId;
  target: AgentId;
  phantom: boolean;
}

export const TREE_PATHS: TreePath[] = [
  { source: 'crown',      target: 'visionary',   phantom: false },  // 1
  { source: 'crown',      target: 'architect',   phantom: false },  // 2
  { source: 'crown',      target: 'nexus',       phantom: false },  // 3
  { source: 'visionary',  target: 'architect',   phantom: false },  // 4
  { source: 'visionary',  target: 'oracle',      phantom: true  },  // 5
  { source: 'visionary',  target: 'nexus',       phantom: false },  // 6
  { source: 'visionary',  target: 'catalyst',    phantom: false },  // 7
  { source: 'architect',  target: 'oracle',      phantom: true  },  // 8
  { source: 'architect',  target: 'nexus',       phantom: false },  // 9
  { source: 'architect',  target: 'guardian',    phantom: false },  // 10
  { source: 'oracle',     target: 'nexus',       phantom: true  },  // 11
  { source: 'catalyst',   target: 'guardian',    phantom: false },  // 12
  { source: 'catalyst',   target: 'nexus',       phantom: false },  // 13
  { source: 'catalyst',   target: 'sentinel',   phantom: false },  // 14
  { source: 'guardian',   target: 'nexus',       phantom: false },  // 15
  { source: 'guardian',   target: 'prism',       phantom: false },  // 16
  { source: 'nexus',      target: 'sentinel',   phantom: false },  // 17
  { source: 'nexus',      target: 'prism',       phantom: false },  // 18
  { source: 'nexus',      target: 'foundation', phantom: false },  // 19
  { source: 'sentinel',   target: 'foundation', phantom: false },  // 20
  { source: 'prism',      target: 'foundation', phantom: false },  // 21
  { source: 'foundation', target: 'gateway',    phantom: false },  // 22
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
