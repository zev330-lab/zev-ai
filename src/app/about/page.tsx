'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Reveal } from '@/components/reveal';

export default function AboutPage() {
  return (
    <section className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="text-sm text-muted tracking-wide uppercase mb-8">
            About
          </p>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl tracking-tight leading-[1.2] mb-12">
            Implementation over strategy.
          </h1>
        </motion.div>

        <div className="space-y-8 text-muted-light leading-[1.8]">
          <Reveal>
            <p>
              Most AI consulting is strategy work — assessments, roadmaps,
              recommendations. You pay for a document that tells you what
              you could do, and then you still need someone to build it.
            </p>
          </Reveal>

          <Reveal>
            <p>
              I skip the document. I build the system.
            </p>
          </Reveal>

          <Reveal>
            <p>
              I came to this work through building. As a real estate
              professional in Newton, Massachusetts, I needed technology
              that didn&apos;t exist — so I built it. Using Claude and modern
              development frameworks, I created a platform spanning thousands
              of pages, running dozens of intelligent agents, handling
              everything from automated client communication to lead scoring
              to content generation to reputation management. A full
              production system, live and working.
            </p>
          </Reveal>

          <Reveal>
            <p>
              That experience changed how I think about AI in business.
              Not as a futuristic concept, but as infrastructure. Something
              you build, deploy, and rely on — the way you rely on your
              CRM or your email. The tools exist today to build production AI
              systems faster and more affordably than most businesses realize.
            </p>
          </Reveal>

          <Reveal>
            <p>
              Now I do the same thing for other businesses. I learn your
              operations, find the highest-impact opportunities, and build
              real systems that do real work. No slide decks. No six-month
              timelines. Working software, usually in weeks.
            </p>
          </Reveal>

          <Reveal>
            <p className="text-foreground">
              Zev Steinmetz — Newton, MA. Builder, not theorist.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <div className="mt-16 pt-16 border-t border-border">
            <Link
              href="/contact"
              className="inline-block border-b border-accent text-accent text-sm tracking-wide pb-1 hover:text-accent-hover hover:border-accent-hover transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
