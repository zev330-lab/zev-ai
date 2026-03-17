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
  last_heartbeat: string | null; // ISO 8601 timestamp from Supabase
  config: Record<string, unknown>;
  is_active: boolean;
  kill_switch: boolean;
  created_at: string;
  updated_at: string;
}

export interface TolaAgentLog {
  id: string; // UUID
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
  id: string; // UUID
  agent_id: AgentId | null;
  metric: string;
  value: number;
  geometry_state: Record<string, unknown> | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Static agent data (position, description, etc.)
// Positions are on an ~800 x 1000 canvas, mirroring Kabbalistic Tree of Life
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

export const TOLA_AGENTS: TolaAgentStatic[] = [
  {
    id: 'crown',
    node_name: 'Crown',
    geometry_engine: 'seed_of_life',
    display_name: 'Crown',
    description: 'Human decision authority — admin dashboard and approval queue',
    tier: 3,
    position: { x: 400, y: 0 },
  },
  {
    id: 'visionary',
    node_name: 'Visionary',
    geometry_engine: 'metatrons_cube',
    display_name: 'Visionary',
    description: 'Multi-source research engine — 13-dimension prospect analysis',
    tier: 1,
    position: { x: 650, y: 150 },
  },
  {
    id: 'architect',
    node_name: 'Architect',
    geometry_engine: 'sri_yantra',
    display_name: 'Architect',
    description: 'Constraint-based planning — pattern analysis and engagement scoping',
    tier: 1,
    position: { x: 150, y: 150 },
  },
  {
    id: 'oracle',
    node_name: 'Oracle',
    geometry_engine: 'torus',
    display_name: 'Oracle',
    description: 'Iterative synthesis — knowledge base and consulting methodology',
    tier: 1,
    position: { x: 400, y: 280 },
  },
  {
    id: 'catalyst',
    node_name: 'Catalyst',
    geometry_engine: 'lotus',
    display_name: 'Catalyst',
    description: 'Progressive engagement — nurture sequences and relationship building',
    tier: 1,
    position: { x: 650, y: 400 },
  },
  {
    id: 'guardian',
    node_name: 'Guardian',
    geometry_engine: 'yin_yang',
    display_name: 'Guardian',
    description: 'Adversarial quality review — input validation and brand enforcement',
    tier: 1,
    position: { x: 150, y: 400 },
  },
  {
    id: 'nexus',
    node_name: 'Nexus',
    geometry_engine: 'flower_of_life',
    display_name: 'Nexus',
    description: 'Intelligent routing — inquiry classification and workflow orchestration',
    tier: 1,
    position: { x: 400, y: 450 },
  },
  {
    id: 'sentinel',
    node_name: 'Sentinel',
    geometry_engine: 'merkabah',
    display_name: 'Sentinel',
    description: 'Triangulated health monitoring — API, database, and application verification',
    tier: 1,
    position: { x: 650, y: 600 },
  },
  {
    id: 'prism',
    node_name: 'Prism',
    geometry_engine: 'vortex',
    display_name: 'Prism',
    description: 'Recursive quality refinement — content scoring and spiral testing',
    tier: 1,
    position: { x: 150, y: 600 },
  },
  {
    id: 'foundation',
    node_name: 'Foundation',
    geometry_engine: 'seed_of_life',
    display_name: 'Foundation',
    description: 'Infrastructure maintenance — database health, log cleanup, metric aggregation',
    tier: 1,
    position: { x: 400, y: 700 },
  },
  {
    id: 'gateway',
    node_name: 'Gateway',
    geometry_engine: 'flower_of_life',
    display_name: 'Gateway',
    description: 'The application itself — user interface and interconnected page delivery',
    tier: 1,
    position: { x: 400, y: 900 },
  },
];

// ---------------------------------------------------------------------------
// Tree of Life edges — 22 traditional Kabbalistic paths
// Format: [source AgentId, target AgentId]
// Ordered by sephiroth number (1=Crown through 10=Gateway/Malkuth)
// ---------------------------------------------------------------------------

export const TREE_OF_LIFE_EDGES: Array<{ source: AgentId; target: AgentId }> = [
  // Path 1 — Crown → Visionary  (Keter → Chokhmah)
  { source: 'crown', target: 'visionary' },
  // Path 2 — Crown → Architect  (Keter → Binah)
  { source: 'crown', target: 'architect' },
  // Path 3 — Crown → Oracle     (Keter → Da'at / hidden sephirah)
  { source: 'crown', target: 'oracle' },
  // Path 4 — Visionary → Architect  (Chokhmah → Binah)
  { source: 'visionary', target: 'architect' },
  // Path 5 — Visionary → Oracle     (Chokhmah → Chesed via Da'at)
  { source: 'visionary', target: 'oracle' },
  // Path 6 — Visionary → Catalyst   (Chokhmah → Chesed)
  { source: 'visionary', target: 'catalyst' },
  // Path 7 — Architect → Oracle     (Binah → Da'at)
  { source: 'architect', target: 'oracle' },
  // Path 8 — Architect → Guardian   (Binah → Gevurah)
  { source: 'architect', target: 'guardian' },
  // Path 9 — Oracle → Catalyst      (Da'at → Chesed)
  { source: 'oracle', target: 'catalyst' },
  // Path 10 — Oracle → Guardian     (Da'at → Gevurah)
  { source: 'oracle', target: 'guardian' },
  // Path 11 — Oracle → Nexus        (Da'at → Tiferet)
  { source: 'oracle', target: 'nexus' },
  // Path 12 — Catalyst → Guardian   (Chesed → Gevurah)
  { source: 'catalyst', target: 'guardian' },
  // Path 13 — Catalyst → Nexus      (Chesed → Tiferet)
  { source: 'catalyst', target: 'nexus' },
  // Path 14 — Catalyst → Sentinel   (Chesed → Netzach)
  { source: 'catalyst', target: 'sentinel' },
  // Path 15 — Guardian → Nexus      (Gevurah → Tiferet)
  { source: 'guardian', target: 'nexus' },
  // Path 16 — Guardian → Prism      (Gevurah → Hod)
  { source: 'guardian', target: 'prism' },
  // Path 17 — Nexus → Sentinel      (Tiferet → Netzach)
  { source: 'nexus', target: 'sentinel' },
  // Path 18 — Nexus → Prism         (Tiferet → Hod)
  { source: 'nexus', target: 'prism' },
  // Path 19 — Nexus → Foundation    (Tiferet → Yesod)
  { source: 'nexus', target: 'foundation' },
  // Path 20 — Sentinel → Prism      (Netzach → Hod)
  { source: 'sentinel', target: 'prism' },
  // Path 21 — Sentinel → Foundation (Netzach → Yesod)
  { source: 'sentinel', target: 'foundation' },
  // Path 22 — Prism → Foundation    (Hod → Yesod → Malkuth connection)
  { source: 'prism', target: 'foundation' },
  // Path 23 — Foundation → Gateway  (Yesod → Malkuth)
  // Note: 23 edges emerge from the 11-node TOLA tree; the canonical 22-path
  // count applies to the traditional 10-sephirot tree. Gateway (Malkuth) adds
  // one additional descent path, completing the full emanation.
  { source: 'foundation', target: 'gateway' },
];

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<AgentStatus, string> = {
  healthy:  '#22c55e', // green-500
  degraded: '#eab308', // yellow-500 (gold)
  critical: '#ef4444', // red-500
  offline:  '#6b7280', // gray-500
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
