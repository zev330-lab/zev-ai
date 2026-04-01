import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename } from 'path';

export interface ScannedProject {
  workspace_dir: string;
  name: string;
  client: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  local_path: string;
  github_url: string | null;
  deployed_url: string | null;
  tech_stack: string[];
  last_commit_date: string | null;
  last_commit_message: string | null;
  git_branch: string | null;
  readme_summary: string | null;
}

// Directories to skip when scanning
const SKIP_DIRS = new Set([
  '_archive', '_credentials', '_scripts', '_templates',
  'node_modules', '.git', '.next', '.vercel',
]);

// Category detection for grouping
const PROJECT_CATEGORIES: Record<string, { client: string; tola_node: string }> = {
  'steinmetz-real-estate': { client: 'Steinmetz Team', tola_node: 'gateway' },
  'zev-ai': { client: 'Internal', tola_node: 'nexus' },
  'kabbalahq-v3': { client: 'Internal', tola_node: 'oracle' },
  'kabbalah-q': { client: 'Internal', tola_node: 'oracle' },
  'ayeka': { client: 'Internal', tola_node: 'oracle' },
  'lisa-sow': { client: 'Rosen Media Group', tola_node: 'catalyst' },
  'lisa-intake': { client: 'Rosen Media Group', tola_node: 'catalyst' },
  'custody-log': { client: 'Internal', tola_node: 'catalyst' },
  'erp-audit': { client: 'Client', tola_node: 'architect' },
  'masssave-intake': { client: 'Client', tola_node: 'catalyst' },
  'bay-state-assessment': { client: 'Client', tola_node: 'architect' },
  'steinmetz-ai-system': { client: 'Steinmetz Team', tola_node: 'visionary' },
};

function execSafe(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, { cwd, timeout: 5000, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function detectTechStack(dir: string): string[] {
  const stack: string[] = [];
  const pkgPath = join(dir, 'package.json');

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps['next']) stack.push('Next.js');
      if (allDeps['react']) stack.push('React');
      if (allDeps['typescript'] || existsSync(join(dir, 'tsconfig.json'))) stack.push('TypeScript');
      if (allDeps['tailwindcss']) stack.push('Tailwind');
      if (allDeps['@supabase/supabase-js']) stack.push('Supabase');
      if (allDeps['@anthropic-ai/sdk'] || allDeps['anthropic']) stack.push('Claude API');
      if (allDeps['framer-motion']) stack.push('Framer Motion');
      if (allDeps['prisma'] || allDeps['@prisma/client']) stack.push('Prisma');
      if (allDeps['express']) stack.push('Express');
      if (allDeps['vue']) stack.push('Vue');
      if (allDeps['svelte']) stack.push('Svelte');
      if (allDeps['recharts']) stack.push('Recharts');
      if (allDeps['@xyflow/react'] || allDeps['reactflow']) stack.push('React Flow');
      if (allDeps['resend']) stack.push('Resend');
    } catch { /* ignore parse errors */ }
  }

  // Check for non-Node projects
  if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'pyproject.toml'))) {
    stack.push('Python');
  }

  // Check for plain HTML/CSS/JS
  if (stack.length === 0) {
    const files = readdirSync(dir).filter(f => !f.startsWith('.'));
    if (files.some(f => f.endsWith('.html'))) stack.push('HTML/CSS/JS');
  }

  return stack;
}

function extractReadmeSummary(dir: string): string | null {
  // Try CLAUDE.md first, then README.md
  for (const file of ['CLAUDE.md', 'README.md']) {
    const path = join(dir, file);
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');

        // Look for ## Overview or first paragraph after title
        const overviewMatch = content.match(/##\s*Overview\s*\n+([\s\S]*?)(?=\n##|\n$)/i);
        if (overviewMatch) {
          return overviewMatch[1].trim().slice(0, 300);
        }

        // Fall back to first non-header, non-empty paragraph
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-') && trimmed.length > 20) {
            return trimmed.slice(0, 300);
          }
        }
      } catch { /* ignore read errors */ }
    }
  }
  return null;
}

function extractDeployedUrl(dir: string): string | null {
  // Check CLAUDE.md for deployed URL
  const claudeMd = join(dir, 'CLAUDE.md');
  if (existsSync(claudeMd)) {
    try {
      const content = readFileSync(claudeMd, 'utf-8');
      const urlMatch = content.match(/\*\*(?:Deployed|Live URL|URL|Deploy):\*\*\s*(https?:\/\/[^\s)]+)/i)
        || content.match(/(?:Deployed|Live URL|URL):\s*(https?:\/\/[^\s)]+)/i);
      if (urlMatch) return urlMatch[1];
    } catch { /* ignore */ }
  }

  // Check README
  const readme = join(dir, 'README.md');
  if (existsSync(readme)) {
    try {
      const content = readFileSync(readme, 'utf-8');
      const urlMatch = content.match(/\*\*(?:Deployed|Live URL|URL):\*\*\s*(https?:\/\/[^\s)]+)/i);
      if (urlMatch) return urlMatch[1];
    } catch { /* ignore */ }
  }

  return null;
}

function extractGithubUrl(dir: string): string | null {
  const remote = execSafe('git remote get-url origin', dir);
  if (!remote) return null;
  // Convert SSH URLs to HTTPS
  if (remote.startsWith('git@github.com:')) {
    return `https://github.com/${remote.slice(15).replace(/\.git$/, '')}`;
  }
  if (remote.includes('github.com')) {
    return remote.replace(/\.git$/, '');
  }
  return remote;
}

function inferStatus(dir: string, dirName: string): 'active' | 'paused' | 'completed' | 'archived' {
  // Check for completed indicators
  const completedDirs = new Set([
    'birthday-bash-game', 'zadies-birthday', 'parker-ben10',
    'parkers-sonic-adventure', 'havis-wicked-adventure',
    'lisa-sow', 'lisa-intake', 'countdown-5pm',
  ]);
  if (completedDirs.has(dirName)) return 'completed';

  // Check git recency
  const lastCommitDate = execSafe('git log -1 --format=%ci', dir);
  if (lastCommitDate) {
    const daysSince = (Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 7) return 'active';
    if (daysSince < 30) return 'active';
    if (daysSince < 90) return 'paused';
    return 'archived';
  }

  return 'paused';
}

function prettifyName(dirName: string): string {
  const nameMap: Record<string, string> = {
    'zev-ai': 'Zev.AI Platform',
    'steinmetz-real-estate': 'Steinmetz Real Estate',
    'kabbalahq-v3': 'KabbalahQ v3',
    'kabbalahq-v2': 'KabbalahQ v2',
    'kabbalahq-tola-v2': 'KabbalahQ TOLA v2',
    'kabbalahq-tola-test': 'KabbalahQ TOLA Test',
    'kabbalah-q': 'KabbalahQ',
    'ayeka': 'Ayeka',
    'custody-log': 'CustodyLog',
    'lisa-sow': 'Lisa Rosen - SOW',
    'lisa-intake': 'Lisa Rosen - Intake',
    'masssave-intake': 'Mass Save Intake',
    'bay-state-assessment': 'Bay State Assessment',
    'steinmetz-ai-system': 'Steinmetz AI System',
    'erp-audit': 'ERP Audit',
    'birthday-bash-game': "Parker & Havi's Birthday Bash",
    'zadies-birthday': "Zadie's Birthday Game",
    'parker-ben10': 'Parker Ben 10 Game',
    'parkers-sonic-adventure': "Parker's Sonic Adventure",
    'havis-wicked-adventure': "Havi's Wicked Adventure",
    'newton-analyzer': 'Newton Analyzer',
    'newton-investment-app': 'Newton Investment App',
    'newton-investment-app-v2': 'Newton Investment v2',
    'newton-v2': 'Newton v2',
    'brookline-analyzer': 'Brookline Analyzer',
    'brookline-v2': 'Brookline v2',
    'hudson-analyzer': 'Hudson Analyzer',
    'hudson-v2': 'Hudson v2',
    'marlborough-analyzer': 'Marlborough Analyzer',
    'marlborough-v2': 'Marlborough v2',
    'us-app': 'US App',
    'spiritual-tracker-app': 'Spiritual Tracker',
    '10-10-App': '10-10 App',
    'chana-ten10': 'Chana Ten10',
    'chana-win-the-day': 'Chana Win The Day',
    'Win-The-Day': 'Win The Day',
    'countdown-5pm': 'Countdown 5PM',
  };
  return nameMap[dirName] || dirName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function scanWorkspace(workspaceDir: string = '/Users/zevsteinmetz/dev'): ScannedProject[] {
  const projects: ScannedProject[] = [];

  if (!existsSync(workspaceDir)) return projects;

  const entries = readdirSync(workspaceDir);

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;

    const fullPath = join(workspaceDir, entry);

    try {
      const stat = statSync(fullPath);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    const isGitRepo = existsSync(join(fullPath, '.git'));
    const hasPackageJson = existsSync(join(fullPath, 'package.json'));
    const hasReadme = existsSync(join(fullPath, 'README.md')) || existsSync(join(fullPath, 'CLAUDE.md'));

    // Must be a git repo or have package.json to be considered a project
    if (!isGitRepo && !hasPackageJson && !hasReadme) continue;

    const category = PROJECT_CATEGORIES[entry] || { client: 'Internal', tola_node: 'gateway' };
    const status = inferStatus(fullPath, entry);

    // Git metadata
    let lastCommitDate: string | null = null;
    let lastCommitMessage: string | null = null;
    let gitBranch: string | null = null;

    if (isGitRepo) {
      lastCommitDate = execSafe('git log -1 --format=%cI', fullPath);
      lastCommitMessage = execSafe('git log -1 --format=%s', fullPath);
      gitBranch = execSafe('git branch --show-current', fullPath);
    }

    projects.push({
      workspace_dir: entry,
      name: prettifyName(entry),
      client: category.client,
      description: extractReadmeSummary(fullPath) || `Project in ~/dev/${entry}`,
      status,
      local_path: fullPath,
      github_url: isGitRepo ? extractGithubUrl(fullPath) : null,
      deployed_url: extractDeployedUrl(fullPath),
      tech_stack: detectTechStack(fullPath),
      last_commit_date: lastCommitDate,
      last_commit_message: lastCommitMessage,
      git_branch: gitBranch,
      readme_summary: extractReadmeSummary(fullPath),
    });
  }

  // Sort: active first, then by last commit date
  projects.sort((a, b) => {
    const statusOrder = { active: 0, paused: 1, completed: 2, archived: 3 };
    const sDiff = statusOrder[a.status] - statusOrder[b.status];
    if (sDiff !== 0) return sDiff;
    if (a.last_commit_date && b.last_commit_date) {
      return new Date(b.last_commit_date).getTime() - new Date(a.last_commit_date).getTime();
    }
    return a.last_commit_date ? -1 : 1;
  });

  return projects;
}
