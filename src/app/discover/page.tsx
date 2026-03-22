'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1] as const;

const TEAM_SIZES = ['Just me', '2–5', '6–15', '16–50', '50+'];
const AI_LEVELS = ['Not yet', 'Dabbled a bit', 'Use them regularly', 'Tried and gave up'];

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  business: string;
  teamSize: string;
  painPoints: string;
  repetitiveWork: string;
  aiExperience: string;
  aiDetails: string;
  magicWand: string;
  success: string;
  anythingElse: string;
}

const INITIAL: FormData = {
  name: '',
  email: '',
  company: '',
  role: '',
  business: '',
  teamSize: '',
  painPoints: '',
  repetitiveWork: '',
  aiExperience: '',
  aiDetails: '',
  magicWand: '',
  success: '',
  anythingElse: '',
};

// Total steps: 0=welcome, 1=name, 2=email, 3=company, 4=role, 5=business, 6=team,
// 7=pain, 8=repetitive, 9=ai, 10=wand, 11=success, 12=anything, 13=review, 14=thanks
const TOTAL_STEPS = 15;
const FIRST_QUESTION = 1;
const REVIEW_STEP = 13;
const THANK_YOU_STEP = 14;

function canAdvance(step: number, data: FormData): boolean {
  switch (step) {
    case 0: return true; // welcome
    case 1: return data.name.trim().length > 0;
    case 2: return true; // email is optional
    case 3: return data.company.trim().length > 0;
    case 4: return data.role.trim().length > 0;
    case 5: return data.business.trim().length > 0;
    case 6: return data.teamSize.length > 0;
    case 7: return data.painPoints.trim().length > 0;
    case 8: return data.repetitiveWork.trim().length > 0;
    case 9: return data.aiExperience.length > 0;
    case 10: return data.magicWand.trim().length > 0;
    case 11: return data.success.trim().length > 0;
    case 12: return true; // optional
    case 13: return true; // review
    default: return false;
  }
}

function buildMailtoBody(data: FormData): string {
  const lines = [
    `Name: ${data.name}`,
    data.email ? `Email: ${data.email}` : '',
    `Company: ${data.company}`,
    `Role: ${data.role}`,
    '',
    `Business Overview:\n${data.business}`,
    '',
    `Team Size: ${data.teamSize}`,
    '',
    `Biggest Pain Points:\n${data.painPoints}`,
    '',
    `Repetitive Work:\n${data.repetitiveWork}`,
    '',
    `AI Experience: ${data.aiExperience}`,
    data.aiDetails ? `AI Details: ${data.aiDetails}` : '',
    '',
    `Magic Wand:\n${data.magicWand}`,
    '',
    `Success in 12 Months:\n${data.success}`,
    '',
    data.anythingElse ? `Anything Else:\n${data.anythingElse}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildClipboardText(data: FormData): string {
  return `CLIENT DISCOVERY — ${data.name}\n${'—'.repeat(40)}\n\n${buildMailtoBody(data)}`;
}

// --- Slide variants ---
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

// --- Chip component ---
function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3.5 rounded-full text-base font-medium transition-all duration-300 border cursor-pointer min-h-[48px] ${
        selected
          ? 'bg-accent text-background border-accent scale-[1.03]'
          : 'bg-transparent text-foreground border-border hover:border-muted-light'
      }`}
    >
      {label}
    </button>
  );
}

// --- Input wrapper for consistent styling ---
const inputClasses =
  'w-full bg-transparent border-b border-border px-0 py-3 text-lg text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300';

const textareaClasses =
  'w-full bg-transparent border-b border-border px-0 py-3 text-lg text-foreground-strong placeholder:text-muted focus:outline-none focus:border-accent transition-colors duration-300 resize-none';

export default function DiscoverPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const progress = step === 0 ? 0 : step >= THANK_YOU_STEP ? 100 : Math.round((step / REVIEW_STEP) * 100);

  const goTo = useCallback((target: number, dir?: number) => {
    setDirection(dir ?? (target > step ? 1 : -1));
    setStep(target);
  }, [step]);

  const next = useCallback(() => {
    if (step < THANK_YOU_STEP && canAdvance(step, data)) {
      goTo(step + 1, 1);
    }
  }, [step, data, goTo]);

  const back = useCallback(() => {
    if (step > 0 && step <= REVIEW_STEP) {
      goTo(step - 1, -1);
    }
  }, [step, goTo]);

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-focus inputs on step change
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 350);
    return () => clearTimeout(timer);
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'TEXTAREA') return; // allow newlines in textarea
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next]);

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const res = await fetch('/api/submit-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch {
      // Fallback: mailto link if API fails
      const subject = encodeURIComponent(`Discovery — ${data.name}, ${data.company}`);
      const body = encodeURIComponent(buildMailtoBody(data));
      window.location.href = `mailto:hello@askzev.ai?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } finally {
      setSubmitting(false);
      goTo(THANK_YOU_STEP, 1);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildClipboardText(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select all text in a temp textarea
      const el = document.createElement('textarea');
      el.value = buildClipboardText(data);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // --- Review field display ---
  const reviewFields: { label: string; value: string; step: number }[] = [
    { label: 'Name', value: data.name, step: 1 },
    { label: 'Email', value: data.email, step: 2 },
    { label: 'Company', value: data.company, step: 3 },
    { label: 'Role', value: data.role, step: 4 },
    { label: 'Business', value: data.business, step: 5 },
    { label: 'Team size', value: data.teamSize, step: 6 },
    { label: 'Pain points', value: data.painPoints, step: 7 },
    { label: 'Repetitive work', value: data.repetitiveWork, step: 8 },
    { label: 'AI experience', value: `${data.aiExperience}${data.aiDetails ? ` — ${data.aiDetails}` : ''}`, step: 9 },
    { label: 'Magic wand', value: data.magicWand, step: 10 },
    { label: 'Success', value: data.success, step: 11 },
    { label: 'Anything else', value: data.anythingElse, step: 12 },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Progress bar */}
      {step > 0 && step < THANK_YOU_STEP && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-border/40">
          <motion.div
            className="h-full bg-accent"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-24 md:py-32">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: EASE }}
            >
              {/* ===== WELCOME ===== */}
              {step === 0 && (
                <div className="text-center md:text-left">
                  <motion.h1
                    className="font-[family-name:var(--font-serif)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                  >
                    Before we meet
                  </motion.h1>
                  <motion.p
                    className="mt-6 text-lg text-muted-light max-w-xl leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
                  >
                    A few questions so we can prepare for our conversation.
                    Takes about 5 minutes.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
                    className="mt-10"
                  >
                    <button
                      onClick={next}
                      className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      Let&apos;s start
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                      </svg>
                    </button>
                  </motion.div>
                </div>
              )}

              {/* ===== Q1: Name ===== */}
              {step === 1 && (
                <Question label="01" question="What&rsquo;s your name?">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={data.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="First name"
                    className={inputClasses}
                    autoComplete="given-name"
                  />
                </Question>
              )}

              {/* ===== Q2: Email ===== */}
              {step === 2 && (
                <Question label="02" question="What&rsquo;s your email?">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="email"
                    value={data.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@company.com"
                    className={inputClasses}
                    autoComplete="email"
                  />
                  <p className="mt-3 text-sm text-muted">Optional — so I can send you a summary of our conversation.</p>
                </Question>
              )}

              {/* ===== Q3: Company ===== */}
              {step === 3 && (
                <Question label="03" question="What&rsquo;s your company or organization?">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={data.company}
                    onChange={(e) => update('company', e.target.value)}
                    placeholder="Company name"
                    className={inputClasses}
                    autoComplete="organization"
                  />
                </Question>
              )}

              {/* ===== Q4: Role ===== */}
              {step === 4 && (
                <Question label="04" question="What&rsquo;s your role?">
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    value={data.role}
                    onChange={(e) => update('role', e.target.value)}
                    placeholder="e.g., CEO, COO, Head of Operations"
                    className={inputClasses}
                    autoComplete="organization-title"
                  />
                </Question>
              )}

              {/* ===== Q5: Business Overview ===== */}
              {step === 5 && (
                <Question label="05" question="In a sentence or two, what does your business do?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={data.business}
                    onChange={(e) => update('business', e.target.value)}
                    placeholder="What do you sell, who do you serve, how big is your team?"
                    className={textareaClasses}
                  />
                </Question>
              )}

              {/* ===== Q6: Team Size ===== */}
              {step === 6 && (
                <Question label="06" question="How many people are on your team?">
                  <div className="flex flex-wrap gap-3 mt-2">
                    {TEAM_SIZES.map((size) => (
                      <Chip
                        key={size}
                        label={size}
                        selected={data.teamSize === size}
                        onClick={() => update('teamSize', size)}
                      />
                    ))}
                  </div>
                </Question>
              )}

              {/* ===== Q7: Pain Points ===== */}
              {step === 7 && (
                <Question label="07" question="What&rsquo;s the most frustrating part of running your business right now?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={4}
                    value={data.painPoints}
                    onChange={(e) => update('painPoints', e.target.value)}
                    placeholder="What keeps you up at night? What takes too long? What falls through the cracks?"
                    className={textareaClasses}
                  />
                  <p className="mt-3 text-sm text-muted">
                    Don&apos;t filter — the messier and more honest, the more helpful.
                  </p>
                </Question>
              )}

              {/* ===== Q8: Repetitive Work ===== */}
              {step === 8 && (
                <Question label="08" question="Where do you or your team spend the most time on repetitive, manual tasks?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={data.repetitiveWork}
                    onChange={(e) => update('repetitiveWork', e.target.value)}
                    placeholder="Data entry, content updates, email follow-ups, reporting..."
                    className={textareaClasses}
                  />
                </Question>
              )}

              {/* ===== Q9: AI Experience ===== */}
              {step === 9 && (
                <Question label="09" question="Have you tried any AI tools yet?">
                  <div className="flex flex-wrap gap-3 mt-2">
                    {AI_LEVELS.map((level) => (
                      <Chip
                        key={level}
                        label={level}
                        selected={data.aiExperience === level}
                        onClick={() => update('aiExperience', level)}
                      />
                    ))}
                  </div>
                  <AnimatePresence>
                    {data.aiExperience && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <input
                          ref={inputRef as React.RefObject<HTMLInputElement>}
                          type="text"
                          value={data.aiDetails}
                          onChange={(e) => update('aiDetails', e.target.value)}
                          placeholder="Which ones? What worked and what didn't?"
                          className={`${inputClasses} mt-6`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Question>
              )}

              {/* ===== Q10: Magic Wand ===== */}
              {step === 10 && (
                <Question label="10" question="If you could wave a magic wand and fix one thing in your business tomorrow, what would it be?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={4}
                    value={data.magicWand}
                    onChange={(e) => update('magicWand', e.target.value)}
                    placeholder="Be specific — the more concrete, the better."
                    className={textareaClasses}
                  />
                </Question>
              )}

              {/* ===== Q11: Success ===== */}
              {step === 11 && (
                <Question label="11" question="What does success look like for your business over the next 12 months?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={data.success}
                    onChange={(e) => update('success', e.target.value)}
                    placeholder="Revenue goals, team growth, new products, operational efficiency..."
                    className={textareaClasses}
                  />
                </Question>
              )}

              {/* ===== Q12: Anything Else ===== */}
              {step === 12 && (
                <Question label="12" question="Anything else you want me to know before we meet?">
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    value={data.anythingElse}
                    onChange={(e) => update('anythingElse', e.target.value)}
                    placeholder="Optional — but this is your space."
                    className={textareaClasses}
                  />
                  <p className="mt-3 text-sm text-muted">This one&apos;s optional.</p>
                </Question>
              )}

              {/* ===== REVIEW ===== */}
              {step === REVIEW_STEP && (
                <div>
                  <p className="text-xs tracking-[0.2em] uppercase text-muted mb-4">Review</p>
                  <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.15] tracking-tight mb-10">
                    Here&apos;s what you&apos;ve shared
                  </h2>
                  <div className="space-y-6 max-h-[55dvh] overflow-y-auto pr-2">
                    {reviewFields.map((field) => (
                      <button
                        key={field.label}
                        type="button"
                        onClick={() => goTo(field.step, -1)}
                        className="block w-full text-left group cursor-pointer"
                      >
                        <p className="text-xs tracking-[0.15em] uppercase text-muted mb-1 group-hover:text-accent transition-colors duration-200">
                          {field.label}
                        </p>
                        <p className="text-foreground-strong whitespace-pre-wrap leading-relaxed">
                          {field.value || <span className="text-muted italic">—</span>}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-8 text-sm text-muted">
                    Your responses go directly to Zev. No one else sees them.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="inline-flex items-center gap-3 bg-accent text-background px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium tracking-wide border border-border text-muted-light hover:border-muted-light transition-all duration-300 cursor-pointer"
                    >
                      {copied ? 'Copied!' : 'Copy all answers'}
                    </button>
                  </div>
                </div>
              )}

              {/* ===== THANK YOU ===== */}
              {step === THANK_YOU_STEP && (
                <div className="text-center md:text-left">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center mb-8 mx-auto md:mx-0"
                  >
                    <motion.svg
                      className="w-8 h-8 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.h1
                    className="font-[family-name:var(--font-serif)] text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
                  >
                    Thank you, {data.name || 'friend'}.
                  </motion.h1>
                  <motion.p
                    className="mt-6 text-lg text-muted-light max-w-lg leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
                  >
                    I&apos;ll review your responses and come prepared
                    for our conversation.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
                    className="mt-10"
                  >
                    <p className="text-sm text-muted">
                      Questions before then?{' '}
                      <a
                        href="mailto:hello@askzev.ai"
                        className="text-accent hover:text-accent-hover transition-colors duration-300"
                      >
                        hello@askzev.ai
                      </a>
                    </p>
                  </motion.div>
                  {!submitted && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
                      className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start"
                    >
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm border border-border text-muted-light hover:border-muted-light transition-all duration-300 cursor-pointer"
                      >
                        {copied ? 'Copied!' : 'Copy all answers'}
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation bar (bottom) */}
      {step >= FIRST_QUESTION && step <= REVIEW_STEP && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50">
          <div className="mx-auto max-w-2xl px-6 py-4 flex items-center justify-between">
            <button
              onClick={back}
              className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground-strong transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
              </svg>
              Back
            </button>

            <span className="text-xs text-muted tabular-nums">
              {step <= 12 ? `${step} of 12` : 'Review'}
            </span>

            {step < REVIEW_STEP && (
              <button
                onClick={next}
                disabled={!canAdvance(step, data)}
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                {step === 12 ? 'Review' : 'Next'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </button>
            )}

            {step === REVIEW_STEP && <div />}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reusable question layout ---
function Question({
  label,
  question,
  children,
}: {
  label: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs tracking-[0.2em] uppercase text-muted mb-4">{label}</p>
      <h2 className="font-[family-name:var(--font-serif)] text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.2] tracking-tight mb-8">
        {question}
      </h2>
      {children}
    </div>
  );
}
