export const SITE = {
  name: 'zev.ai',
  title: 'Zev Steinmetz — AI Implementation Consultant',
  description: 'I don\'t advise on AI. I build it. Custom AI systems, automated workflows, and intelligent platforms for businesses ready to transform.',
  url: 'https://zev.ai',
  email: 'zev@zev.ai',
  calendly: '#', // placeholder
} as const;

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
] as const;

export const STATS = [
  { value: 2000, suffix: '+', label: 'Pages Built' },
  { value: 18, suffix: '', label: 'AI Agents Deployed' },
  { value: 99.9, suffix: '%', label: 'Uptime' },
  { value: 0, suffix: '', label: 'Errors in Production', prefix: '' },
] as const;

export const CAPABILITIES = [
  {
    title: 'AI-Powered Websites',
    description: 'Full-stack platforms with intelligent features — AI chat, dynamic content, personalized experiences.',
    icon: 'globe',
  },
  {
    title: 'Automated Workflows',
    description: 'Systems that run themselves — lead nurture, email sequences, data pipelines, cron-driven operations.',
    icon: 'workflow',
  },
  {
    title: 'Intelligent Dashboards',
    description: 'Role-based dashboards with real-time data, automated reporting, and actionable insights.',
    icon: 'dashboard',
  },
  {
    title: 'AI Chat Systems',
    description: 'Streaming conversational AI embedded in your platform — concierge, support, or sales agents.',
    icon: 'chat',
  },
  {
    title: 'Content Engines',
    description: 'AI-driven content generation pipelines — SEO pages, neighborhood guides, blog posts at scale.',
    icon: 'content',
  },
  {
    title: 'Data Pipeline Automation',
    description: 'Automated data collection, transformation, scoring, and routing with intelligent decision logic.',
    icon: 'data',
  },
] as const;

export const SERVICES = [
  {
    tier: 'Assessment',
    name: 'AI Readiness Assessment',
    price: '$2,500–$5,000',
    description: 'A comprehensive audit of your business operations to identify the highest-ROI AI opportunities.',
    includes: [
      'Process mapping & workflow analysis',
      'Current tool & technology audit',
      'AI opportunity scoring matrix',
      'Prioritized implementation roadmap',
      '90-day action plan',
    ],
    ideal: 'Businesses curious about AI but unsure where to start',
    deliverable: 'AI Opportunity Roadmap document',
    cta: 'Book Assessment',
  },
  {
    tier: 'Implementation',
    name: 'AI Workflow Implementation',
    price: '$5,000–$25,000',
    description: 'Custom-built AI systems deployed directly into your business operations.',
    includes: [
      'Architecture design & planning',
      'Full development & testing',
      'Deployment & integration',
      'Team training & documentation',
      '30-day post-launch support',
    ],
    ideal: 'Businesses ready to transform specific operations',
    deliverable: 'Production-ready AI system',
    examples: ['AI chatbots', 'Automated content pipelines', 'Intelligent dashboards', 'Document processing', 'CRM automation'],
    cta: 'Start Building',
    featured: true,
  },
  {
    tier: 'Fractional',
    name: 'Fractional AI Officer',
    price: '$5,000–$10,000/mo',
    description: 'Ongoing AI strategy and implementation embedded in your business.',
    includes: [
      'Weekly strategy sessions',
      'Continuous automation deployment',
      'Team training & upskilling',
      'New opportunity identification',
      'Performance optimization',
    ],
    ideal: 'Businesses that want AI as a core competency',
    deliverable: 'Ongoing AI transformation',
    cta: 'Learn More',
  },
] as const;
