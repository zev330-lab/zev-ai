// Token-to-cost conversion utilities
//
// Blended rate across Haiku ($0.25/1M input, $1.25/1M output) and Sonnet ($3/1M input, $15/1M output).
// Most agents use Haiku for routing/classification, Sonnet for content generation.
// Weighted average assuming 70% Haiku, 30% Sonnet usage:
//   Haiku avg rate: ($0.25 + $1.25) / 2 / 1000 = $0.00075 / 1K tokens
//   Sonnet avg rate: ($3 + $15) / 2 / 1000 = $0.009 / 1K tokens
//   Blended: 0.7 * 0.00075 + 0.3 * 0.009 = $0.003225 — rounded up to $0.006 to account for
//   the higher output token ratio in Claude responses vs. prompts.
const BLENDED_RATE_PER_1K = 0.006; // $0.006 per 1K tokens

export function tokensToCost(tokens: number): number {
  return (tokens / 1000) * BLENDED_RATE_PER_1K;
}

export function formatCost(dollars: number): string {
  if (dollars < 0.01) return '<$0.01';
  if (dollars < 1) return `$${dollars.toFixed(2)}`;
  if (dollars < 100) return `$${dollars.toFixed(1)}`;
  return `$${Math.round(dollars)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}
