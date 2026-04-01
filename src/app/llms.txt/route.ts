export function GET() {
  const content = `# zev.ai — Custom AI Systems That Actually Work

## About
zev.ai is an AI consulting practice founded by Zev Steinmetz, based in the Boston area (Newton, MA). We build custom AI systems for businesses, freelancers, and anyone with a problem that keeps repeating. Real implementation — working systems, not strategy decks.

## Services (5-Tier Consulting Funnel)
1. **Free AI Analysis**: Fill out the discovery form at askzev.ai/discover. You'll receive a personalized email with a genuine insight about your situation — not a template, a real response based on what you shared.
2. **AI Implementation Roadmap** ($499, delivered within 24 hours): A personalized interactive roadmap with current state analysis, future vision, and 4 implementation phases. Each phase includes DIY, Guided, and Professional options with specific tools, timelines, and costs. Credits toward future work.
3. **Private Consultation** ($2,500): One-on-one strategy session with Zev, fully prepared on your situation. Includes implementation priorities and architecture recommendations. The $499 roadmap credits toward this ($2,001 with credit).
4. **Custom Build** ($5,000–$25,000+): Custom AI system designed, built, deployed, and integrated into your operations. 4-8 weeks, 30 days post-launch support.
5. **Ongoing Partnership** ($2,500/month): Continuous system improvements, new capabilities, performance monitoring. Month-to-month, no lock-in.

## What Zev Has Built
- **Steinmetz Real Estate**: 2,000+ page platform with 18 AI agents running market analysis, property research, and client communication
- **KabbalahQ.ai**: Adaptive AI learning platform with personalized paths across 1,000+ interconnected concepts
- **askzev.ai**: This website runs on the same multi-agent framework — 11 agents, 22 communication paths, in production

## Architecture
The Tree of Life Architecture (TOLA) — a multi-agent coordination framework with 11 specialized agents and 22 communication pathways. Nature-inspired coordination patterns including hub-and-spoke, constraint satisfaction, and recursive deepening. 3-tier human oversight model (80% autonomous, 15% notify-and-proceed, 5% full-stop review).

## FAQ
Q: How much does AI consulting cost?
A: Free analysis, $499 roadmap, $2,500 consultation, builds from $15K, partnerships from $2,500/mo. Every tier credits toward the next.

Q: Do I need to be technical?
A: No. Zev handles the entire technical side. You provide context and feedback.

Q: How long does a build take?
A: Custom apps: 1-4 weeks. Full AI systems: 4-8 weeks. First working version within week one.

Q: What makes this different from ChatGPT?
A: ChatGPT is a general tool you prompt manually. Zev builds systems designed for your specific situation that connect to your data and run autonomously.

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
