'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Design tokens — warm, premium, light
// ---------------------------------------------------------------------------
const C = {
  bg: '#FAFAF8',
  sage: '#A8B5A0',
  sageDark: '#8A9B80',
  sageLight: '#C8D4C0',
  gold: '#C4A265',
  goldDark: '#A6873F',
  goldLight: '#D4B87A',
  rose: '#D4A0A0',
  roseDark: '#B87878',
  charcoal: '#2C2C2C',
  charcoalLight: '#5A5A5A',
  charcoalLighter: '#8A8A8A',
  border: '#E8E6E2',
  cardBg: '#FFFFFF',
  warmWhite: '#FFFDF9',
} as const;

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ---------------------------------------------------------------------------
// Types matching the generation JSON structure
// ---------------------------------------------------------------------------
interface PhaseOption {
  label: string;
  description: string;
  tools?: string[];
  steps?: string[];
  what_you_get?: string;
  time_estimate: string;
  cost_estimate: string;
  pros: string[];
  cons: string[];
}

interface Phase {
  number: number;
  title: string;
  description: string;
  duration: string;
  options: {
    diy: PhaseOption;
    hybrid: PhaseOption;
    professional: PhaseOption;
  };
}

interface RoadmapData {
  personalized_intro: string;
  current_state: {
    headline: string;
    pain_reframed: string;
    current_tools: string;
    industry_context: string;
    hidden_costs: string;
  };
  future_vision: {
    headline: string;
    outcomes: string[];
    timeline: string;
    key_metrics: string[];
  };
  phases: Phase[];
  path_forward: {
    summary: string;
    chosen_path_note: string;
    consultation_pitch: string;
  };
}

type OptionKey = 'diy' | 'hybrid' | 'professional';

interface Props {
  content: RoadmapData;
  name: string;
  company: string | null;
  createdAt: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function RoadmapContent({ content, name, company, createdAt, slug }: Props) {
  const [selectedOptions, setSelectedOptions] = useState<Record<number, OptionKey>>({});
  const firstName = name.trim().split(/\s+/)[0];
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const selectOption = (phaseNum: number, option: OptionKey) => {
    setSelectedOptions(prev => ({
      ...prev,
      [phaseNum]: prev[phaseNum] === option ? undefined! : option,
    }));
  };

  // Calculate totals from selected options
  const selectedPhases = content.phases?.filter(p => selectedOptions[p.number]) || [];
  const totalSummary = selectedPhases.map(p => {
    const opt = p.options[selectedOptions[p.number]];
    return {
      phase: p.title,
      option: opt?.label || selectedOptions[p.number],
      time: opt?.time_estimate || '—',
      cost: opt?.cost_estimate || '—',
    };
  });

  return (
    <div style={{ background: C.bg }} className="min-h-screen">
      {/* Header */}
      <header
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${C.warmWhite} 0%, ${C.bg} 50%, ${C.sageLight}15 100%)` }}
      >
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p
              className="text-xs font-medium tracking-[0.2em] uppercase mb-6"
              style={{ color: C.sage }}
            >
              Prepared by Zev.AI
            </p>
            <h1
              className="font-[family-name:var(--font-source-serif)] text-[clamp(1.8rem,5vw,2.8rem)] leading-[1.15] tracking-tight"
              style={{ color: C.charcoal }}
            >
              Your AI Implementation Roadmap
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={{ color: C.charcoalLight }}>
              <span>{name}{company ? ` — ${company}` : ''}</span>
              <span style={{ color: C.border }}>|</span>
              <span>{date}</span>
            </div>
          </motion.div>
        </div>
        {/* Subtle bottom border */}
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${C.border}, transparent)` }} />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        {/* Personalized Intro */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="mb-16"
        >
          <div
            className="text-base md:text-[17px] leading-[1.8] whitespace-pre-line"
            style={{ color: C.charcoalLight }}
          >
            {content.personalized_intro}
          </div>
        </motion.section>

        {/* Section 1: Where You Are Now */}
        <SectionBlock
          number="01"
          title="Where You Are Now"
          delay={0.3}
        >
          <h3
            className="font-[family-name:var(--font-source-serif)] text-xl md:text-2xl mb-6"
            style={{ color: C.charcoal }}
          >
            {content.current_state?.headline}
          </h3>
          <div className="space-y-5">
            <InfoCard label="The Real Impact" content={content.current_state?.pain_reframed} color={C.rose} />
            <InfoCard label="Your Current Tools" content={content.current_state?.current_tools} color={C.sage} />
            <InfoCard label="Industry Context" content={content.current_state?.industry_context} color={C.gold} />
            <InfoCard label="Hidden Costs" content={content.current_state?.hidden_costs} color={C.roseDark} />
          </div>
        </SectionBlock>

        {/* Section 2: Where You're Going */}
        <SectionBlock
          number="02"
          title="Where You're Going"
          delay={0.4}
        >
          <h3
            className="font-[family-name:var(--font-source-serif)] text-xl md:text-2xl mb-6"
            style={{ color: C.charcoal }}
          >
            {content.future_vision?.headline}
          </h3>

          {/* Outcomes */}
          <div className="mb-8">
            <p className="text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: C.sage }}>
              Expected Outcomes
            </p>
            <div className="space-y-3">
              {content.future_vision?.outcomes?.map((outcome, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, ease: EASE }}
                  className="flex gap-3 items-start"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-medium"
                    style={{ background: `${C.sage}15`, color: C.sage }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>
                    {outcome}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: C.goldDark }}>
                Timeline
              </p>
              <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>
                {content.future_vision?.timeline}
              </p>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: C.goldDark }}>
                Key Metrics
              </p>
              <ul className="space-y-1">
                {content.future_vision?.key_metrics?.map((m, i) => (
                  <li key={i} className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>
                    — {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionBlock>

        {/* Sections 3-6: Implementation Phases */}
        {content.phases?.map((phase, idx) => (
          <SectionBlock
            key={phase.number}
            number={String(idx + 3).padStart(2, '0')}
            title={phase.title}
            delay={0.2}
          >
            <p className="text-[15px] leading-relaxed mb-2" style={{ color: C.charcoalLight }}>
              {phase.description}
            </p>
            <p className="text-sm mb-8" style={{ color: C.charcoalLighter }}>
              Estimated duration: {phase.duration}
            </p>

            {/* A/B/C Options */}
            <div className="space-y-3">
              {(['diy', 'hybrid', 'professional'] as OptionKey[]).map((optKey) => {
                const opt = phase.options?.[optKey];
                if (!opt) return null;
                const isSelected = selectedOptions[phase.number] === optKey;

                return (
                  <OptionCard
                    key={optKey}
                    optionKey={optKey}
                    option={opt}
                    isSelected={isSelected}
                    onSelect={() => selectOption(phase.number, optKey)}
                  />
                );
              })}
            </div>
          </SectionBlock>
        ))}

        {/* Section 7: Path Forward */}
        <SectionBlock
          number={String((content.phases?.length || 4) + 3).padStart(2, '0')}
          title="Your Path Forward"
          delay={0.2}
        >
          <div className="space-y-6">
            <p className="text-base leading-[1.8]" style={{ color: C.charcoalLight }}>
              {content.path_forward?.summary}
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLighter }}>
              {content.path_forward?.chosen_path_note}
            </p>

            {/* Summary of selected options */}
            {totalSummary.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl"
                style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
              >
                <p className="text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: C.sage }}>
                  Your Selected Options
                </p>
                <div className="space-y-3">
                  {totalSummary.map((s, i) => (
                    <div key={i} className="flex flex-wrap justify-between gap-2 text-sm" style={{ color: C.charcoalLight }}>
                      <span className="font-medium" style={{ color: C.charcoal }}>{s.phase}</span>
                      <span>{s.option} — {s.time} — {s.cost}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Consultation CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE }}
              className="mt-10 p-8 rounded-2xl text-center"
              style={{
                background: `linear-gradient(135deg, ${C.warmWhite}, ${C.gold}08)`,
                border: `1px solid ${C.gold}30`,
              }}
            >
              <p className="text-base leading-[1.8] mb-6" style={{ color: C.charcoalLight }}>
                {content.path_forward?.consultation_pitch}
              </p>
              <p className="text-sm mb-6" style={{ color: C.charcoalLighter }}>
                Your $499 roadmap investment credits toward the consultation fee.
              </p>
              <a
                href="https://askzev.ai/discover?track=consultation&credit=roadmap"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: C.gold, color: '#fff' }}
              >
                Book a Consultation — $2,001
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs mt-3" style={{ color: C.charcoalLighter }}>
                $2,500 consultation — $499 roadmap credit = $2,001
              </p>
            </motion.div>
          </div>
        </SectionBlock>

        {/* Footer */}
        <footer className="mt-20 pt-8 text-center" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-sm" style={{ color: C.charcoalLighter }}>
            Prepared with care by{' '}
            <a href="https://askzev.ai" className="transition-colors" style={{ color: C.sage }}>
              zev.ai
            </a>
          </p>
          <p className="text-xs mt-2" style={{ color: `${C.charcoalLighter}80` }}>
            This roadmap is confidential and prepared exclusively for {name}.
          </p>
        </footer>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Block
// ---------------------------------------------------------------------------
function SectionBlock({
  number,
  title,
  delay = 0,
  children,
}: {
  number: string;
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-8">
        <span
          className="text-xs font-medium tracking-[0.2em]"
          style={{ color: C.sage }}
        >
          {number}
        </span>
        <div className="h-px flex-1" style={{ background: C.border }} />
      </div>
      <h2
        className="font-[family-name:var(--font-source-serif)] text-[clamp(1.4rem,4vw,2rem)] leading-[1.2] tracking-tight mb-8"
        style={{ color: C.charcoal }}
      >
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Info Card
// ---------------------------------------------------------------------------
function InfoCard({ label, content, color }: { label: string; content: string; color: string }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
      <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color }}>
        {label}
      </p>
      <p className="text-[15px] leading-relaxed" style={{ color: C.charcoalLight }}>
        {content}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Option Card (Interactive A/B/C)
// ---------------------------------------------------------------------------
function OptionCard({
  optionKey,
  option,
  isSelected,
  onSelect,
}: {
  optionKey: OptionKey;
  option: PhaseOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colorMap: Record<OptionKey, string> = {
    diy: C.sage,
    hybrid: C.gold,
    professional: C.rose,
  };
  const iconMap: Record<OptionKey, string> = {
    diy: 'A',
    hybrid: 'B',
    professional: 'C',
  };
  const accentColor = colorMap[optionKey];

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-300"
      style={{
        background: C.cardBg,
        border: `2px solid ${isSelected ? accentColor : C.border}`,
        boxShadow: isSelected ? `0 0 0 1px ${accentColor}20, 0 4px 20px ${accentColor}10` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onClick={onSelect}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Header — always visible */}
      <div className="p-5 flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-semibold"
          style={{
            background: isSelected ? accentColor : `${accentColor}15`,
            color: isSelected ? '#fff' : accentColor,
          }}
        >
          {iconMap[optionKey]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium" style={{ color: C.charcoal }}>
            {option.label}
          </p>
          <p className="text-sm mt-0.5" style={{ color: C.charcoalLighter }}>
            {option.time_estimate} · {option.cost_estimate}
          </p>
        </div>
        <motion.div
          animate={{ rotate: isSelected ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.charcoalLighter} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="h-px mb-5" style={{ background: C.border }} />

              <p className="text-[15px] leading-relaxed mb-5" style={{ color: C.charcoalLight }}>
                {option.description}
              </p>

              {option.what_you_get && (
                <div className="mb-5">
                  <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: accentColor }}>
                    What You Get
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: C.charcoalLight }}>
                    {option.what_you_get}
                  </p>
                </div>
              )}

              {option.tools && option.tools.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: accentColor }}>
                    Recommended Tools
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {option.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: `${accentColor}10`, color: accentColor }}
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {option.steps && option.steps.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: accentColor }}>
                    Steps
                  </p>
                  <ol className="space-y-2">
                    {option.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: C.charcoalLight }}>
                        <span className="font-medium flex-shrink-0" style={{ color: accentColor }}>{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: '#6B9F6B' }}>
                    Pros
                  </p>
                  <ul className="space-y-1">
                    {option.pros?.map((pro, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: C.charcoalLight }}>
                        <span style={{ color: '#6B9F6B' }}>+</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium tracking-[0.1em] uppercase mb-2" style={{ color: C.roseDark }}>
                    Cons
                  </p>
                  <ul className="space-y-1">
                    {option.cons?.map((con, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: C.charcoalLight }}>
                        <span style={{ color: C.roseDark }}>-</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
