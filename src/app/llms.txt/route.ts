export function GET() {
  const content = `# zev.ai — Custom AI Systems That Actually Work

## About
zev.ai is an AI consulting practice founded by Zev Steinmetz, based in Newton, Massachusetts. Custom AI systems for businesses, freelancers, and anyone with a problem that keeps repeating. Real implementation — working systems, not strategy decks.

## Services
- **Free Summary**: Tell Zev what you're dealing with — get an honest take on where AI could help. No cost, no commitment.
- **Insight Report** ($499, 24 hours): Detailed analysis of your situation with specific AI opportunities and honest tradeoffs.
- **Strategy Session** ($2,500, 1 hour): Focused working session with Zev, prepared on your situation.
- **Build** ($15,000+, 4-8 weeks): Custom AI system designed, built, deployed, and integrated. 30 days post-launch support.
- **Custom Apps** ($1,000+, 1-4 weeks): Focused tools for your exact use case — personal, professional, or business.
- **Ongoing Partnership** ($2,500/mo): Continuous improvements, new capabilities, month-to-month.

## What Zev Has Built
- **Steinmetz Real Estate**: 2,000+ page platform with 18 AI agents running market analysis, property research, and client communication
- **KabbalahQ.ai**: Adaptive AI learning platform with personalized paths across 1,000+ interconnected concepts
- **askzev.ai**: This website runs on the same multi-agent framework — 11 agents, 22 communication paths, in production

## Architecture
Multi-agent coordination framework with 11 specialized agents and 22 communication pathways. Nature-inspired coordination patterns including hub-and-spoke, constraint satisfaction, and recursive deepening. 3-tier human oversight model (80% autonomous, 15% notify-and-proceed, 5% full-stop review).

## Contact
- Website: https://askzev.ai
- Email: hello@askzev.ai
- Discovery form: https://askzev.ai/discover
- Location: Newton, MA, USA

## Links
- Homepage: https://askzev.ai
- Services: https://askzev.ai/services
- Our Approach: https://askzev.ai/approach
- Case Studies: https://askzev.ai/work
- About: https://askzev.ai/about
- Blog: https://askzev.ai/blog
- Contact: https://askzev.ai/contact
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
