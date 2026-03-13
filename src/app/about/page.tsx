'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Section, SectionHeader } from '@/components/section';

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-4 text-sm font-medium tracking-widest text-accent uppercase font-[family-name:var(--font-mono)]">
              About
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight">
              I Build Systems,{' '}
              <span className="gradient-text">Not Slide Decks</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <Section className="pt-8">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Avatar placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-1"
            >
              <div className="aspect-square rounded-2xl overflow-hidden glow-border">
                <div className="w-full h-full bg-gradient-to-br from-accent/20 via-accent-violet/20 to-accent-cyan/20 flex items-center justify-center">
                  <span className="text-6xl font-bold font-[family-name:var(--font-display)] gradient-text">
                    ZS
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center md:text-left">
                <h2 className="text-xl font-bold font-[family-name:var(--font-display)]">Zev Steinmetz</h2>
                <p className="text-sm text-accent mt-1">AI Implementation Consultant</p>
                <p className="text-sm text-muted mt-1">Newton, MA</p>
              </div>
            </motion.div>

            {/* Story content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 space-y-6 text-muted-light leading-relaxed"
            >
              <p className="text-lg text-foreground font-medium">
                I&apos;m a real estate entrepreneur who discovered that AI could build
                an entire technology platform — and then turned that discovery into
                a consulting practice.
              </p>

              <p>
                As an agent at William Raveis Real Estate in Newton, Massachusetts,
                I saw firsthand how much of the real estate business runs on manual
                processes — lead follow-up, client nurture, reputation management,
                market analysis, content creation. All of it important, all of it
                time-consuming, and all of it ripe for automation.
              </p>

              <p>
                So I built something about it.
              </p>

              <p>
                Using Claude and Claude Code, I built{' '}
                <a href="https://steinmetzrealestate.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light transition-colors">
                  SteinmetzRealEstate.com
                </a>
                {' '}— a 2,000+ page Next.js platform with 18 AI agents running in production.
                Automated lead scoring that rates prospects 0-100 and routes them intelligently.
                An AI-powered neighborhood concierge with streaming chat. An SOI nurture engine
                that drafts personalized emails on a daily cron and queues them for human approval.
                Automated reputation and review management. Role-based dashboards with real-time data.
                A full Supabase backend with row-level security. All deployed on Vercel.
              </p>

              <p>
                Not a prototype. Not a demo. A full enterprise-grade technology stack,
                built entirely with AI-assisted development.
              </p>

              <div className="border-l-2 border-accent pl-6 py-2">
                <p className="text-foreground font-medium italic">
                  &ldquo;If AI can do this for real estate, it can transform any business.&rdquo;
                </p>
              </div>

              <p>
                That realization is why zev.ai exists. Most businesses think enterprise-grade
                AI systems require massive teams and six-figure budgets. They don&apos;t. The tools
                exist today to build production AI systems faster and more affordably than
                anyone thought possible — if you know how to use them.
              </p>

              <p>
                I bring enterprise-grade AI capabilities to businesses that think they
                can&apos;t afford it. I don&apos;t create slide decks about what AI could do.
                I build the systems. I deploy them. I train your team. And then I help
                you find the next opportunity.
              </p>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* What I Built */}
      <Section className="bg-surface/50 border-y border-surface-border">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            eyebrow="The System"
            title="What I Built for Real Estate"
            description="A complete overview of the Steinmetz Real Estate platform — every component built with AI-assisted development."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'AI Neighborhood Concierge', desc: 'Streaming chat powered by Claude API with deep knowledge of Newton, Brookline, Needham, and MetroWest neighborhoods.' },
              { title: 'Lead Scoring Engine', desc: 'Automated scoring (0-100) with intelligent routing logic based on behavior, demographics, and engagement signals.' },
              { title: 'SOI Nurture System', desc: 'Daily cron-driven system that drafts personalized emails, queues for human approval, and manages ongoing client relationships.' },
              { title: 'Reputation Management', desc: 'Automated review monitoring, response drafting, and reputation tracking across platforms.' },
              { title: 'Role-Based Dashboards', desc: '25 SOPs across team roles, filtered views, real-time data, and agent-specific task management.' },
              { title: 'Content Engine', desc: '2,000+ SEO-optimized pages generated at scale — neighborhood guides, market reports, and community content.' },
              { title: 'Communication Agents', desc: 'Automated email sequences, follow-up reminders, and multi-channel communication management.' },
              { title: 'Recruiting Pipeline', desc: 'Complete recruiting system with candidate tracking, email templates, and activity logging.' },
              { title: 'Supabase Backend', desc: '28+ database tables with row-level security, PostgreSQL functions, and automated data pipelines.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.1 }}
                className="rounded-xl border border-surface-border bg-surface p-6"
              >
                <h3 className="font-semibold font-[family-name:var(--font-display)] text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-light leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* Philosophy */}
      <Section>
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeader
            eyebrow="Philosophy"
            title="How I Think About AI"
          />
          <div className="space-y-8">
            {[
              { title: 'Build, don\'t advise', text: 'The world has enough AI consultants producing reports. I produce working systems. If it doesn\'t run in production, it doesn\'t count.' },
              { title: 'AI is the tool, not the product', text: 'Your customers shouldn\'t know AI is involved. They should just notice that everything works better, faster, and more personally.' },
              { title: 'Start with ROI, not technology', text: 'Every engagement starts by identifying the highest-ROI opportunity. Technology decisions follow business logic, not the other way around.' },
              { title: 'Ship fast, iterate faster', text: 'AI-assisted development means we can move at a pace that traditional development can\'t match. You see results in weeks, not quarters.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="shrink-0 w-1 rounded-full bg-gradient-to-b from-accent to-accent-violet" />
                <div>
                  <h3 className="font-semibold font-[family-name:var(--font-display)] text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-light leading-relaxed">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t border-surface-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-display)]">
            Let&apos;s build something{' '}
            <span className="gradient-text">together</span>
          </h2>
          <p className="mt-4 text-muted-light">
            If you&apos;re ready to bring AI into your business operations, I&apos;d love to talk.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-white hover:bg-accent-light transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            Book a Discovery Call
          </Link>
        </div>
      </Section>
    </>
  );
}
