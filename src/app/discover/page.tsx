'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Design tokens — warm, calming, light
// ---------------------------------------------------------------------------
const C = {
  bg: '#FAFAF8',
  sage: '#A8B5A0',
  sageDark: '#8A9B80',
  sageLight: '#C8D4C0',
  gold: '#C4A265',
  goldDark: '#A6873F',
  rose: '#D4A0A0',
  roseDark: '#B87878',
  charcoal: '#2C2C2C',
  charcoalLight: '#5A5A5A',
  charcoalLighter: '#8A8A8A',
  border: '#E8E6E2',
  cardBg: '#FFFFFF',
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;
const TOTAL_SCREENS = 9;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Intent = 'build' | 'optimize' | 'unsure';
type Audience = 'personal' | 'business' | 'both';

interface FunnelData {
  intent: Intent | null;
  audience: Audience | null;
  painText: string;
  acknowledgmentText: string;
  hopeText: string;
  // App path
  appDescription: string;
  appUsers: string;
  appExisting: string;
  // Business AI path
  businessTools: string[];
  teamSize: string;
  aiExperience: string;
  // Personal AI path
  personalTools: string[];
  personalTriedFailed: string;
  // Both path
  bothWorkOverview: string;
  bothTools: string[];
  // Unsure path
  unsureDayOverview: string;
  unsureMagicWand: string;
  // Audio
  audioBlob: Blob | null;
  audioUrl: string | null;
  // Contact
  name: string;
  email: string;
  phone: string;
  company: string;
  referralSource: string;
}

const INITIAL_DATA: FunnelData = {
  intent: null,
  audience: null,
  painText: '',
  acknowledgmentText: '',
  hopeText: '',
  appDescription: '',
  appUsers: '',
  appExisting: '',
  businessTools: [],
  teamSize: '',
  aiExperience: '',
  personalTools: [],
  personalTriedFailed: '',
  bothWorkOverview: '',
  bothTools: [],
  unsureDayOverview: '',
  unsureMagicWand: '',
  audioBlob: null,
  audioUrl: null,
  name: '',
  email: '',
  phone: '',
  company: '',
  referralSource: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDetailPath(intent: Intent | null, audience: Audience | null) {
  if (intent === 'build') return 'app';
  if (intent === 'unsure') return 'unsure';
  if (audience === 'personal') return 'personal_ai';
  if (audience === 'business') return 'business_ai';
  return 'both_ai';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function DiscoverPage() {
  const [screen, setScreen] = useState(0);
  const [form, setForm] = useState<FunnelData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [discoveryId, setDiscoveryId] = useState<string | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [ackFetched, setAckFetched] = useState(false);

  // Audio recording
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const update = useCallback(<K extends keyof FunnelData>(key: K, value: FunnelData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  function next() {
    if (screen < TOTAL_SCREENS - 1) setScreen(s => s + 1);
  }

  function prev() {
    if (screen > 0) setScreen(s => s - 1);
  }

  // Fetch acknowledgment when entering screen 3
  useEffect(() => {
    if (screen === 3 && !ackFetched && form.painText.trim()) {
      setAckLoading(true);
      setAckFetched(true);
      fetch('/api/discover/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          painText: form.painText,
          intent: form.intent,
          audience: form.audience,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.acknowledgment) {
            update('acknowledgmentText', data.acknowledgment);
          }
        })
        .catch(() => {})
        .finally(() => setAckLoading(false));
    }
  }, [screen, ackFetched, form.painText, form.intent, form.audience, update]);

  // Audio recording handlers
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      setRecordingTime(0);

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        update('audioBlob', blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mr.start();
      setRecording(true);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      // Microphone not available
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function clearAudio() {
    update('audioBlob', null);
    update('audioUrl', null);
    setAudioPreviewUrl(null);
    setRecordingTime(0);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update('audioBlob', file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  }

  // Submit
  async function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);

    try {
      // Upload audio first if exists
      let audioUrl: string | null = null;
      if (form.audioBlob) {
        const audioFormData = new FormData();
        audioFormData.append('file', form.audioBlob, 'recording.webm');
        const audioRes = await fetch('/api/discover/upload-audio', {
          method: 'POST',
          body: audioFormData,
        });
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          audioUrl = audioData.url || null;
        }
      }

      const detailPath = getDetailPath(form.intent, form.audience);
      const detailsJson: Record<string, unknown> = {};

      if (detailPath === 'app') {
        detailsJson.appDescription = form.appDescription;
        detailsJson.appUsers = form.appUsers;
        detailsJson.appExisting = form.appExisting;
      } else if (detailPath === 'business_ai') {
        detailsJson.businessTools = form.businessTools;
        detailsJson.teamSize = form.teamSize;
        detailsJson.aiExperience = form.aiExperience;
      } else if (detailPath === 'personal_ai') {
        detailsJson.personalTools = form.personalTools;
        detailsJson.personalTriedFailed = form.personalTriedFailed;
      } else if (detailPath === 'both_ai') {
        detailsJson.bothWorkOverview = form.bothWorkOverview;
        detailsJson.bothTools = form.bothTools;
      } else {
        detailsJson.unsureDayOverview = form.unsureDayOverview;
        detailsJson.unsureMagicWand = form.unsureMagicWand;
      }

      const dbPath = form.intent === 'build' ? 'app' : form.intent === 'optimize' ? 'solution' : 'unsure';

      const res = await fetch('/api/submit-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: dbPath,
          audience: form.audience,
          pain_text: form.painText,
          acknowledgment_text: form.acknowledgmentText,
          hope_text: form.hopeText,
          details_json: detailsJson,
          audio_url: audioUrl,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          referral_source: form.referralSource,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscoveryId(data.discovery_id || null);
      }
    } catch {
      // Silent fail — confirmation screen will still show
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      setScreen(8);
    }
  }

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div style={{ background: C.bg, minHeight: '100dvh' }} className="relative">
      {/* Progress dots */}
      {!submitted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-1.5">
          {Array.from({ length: TOTAL_SCREENS - 1 }).map((_, i) => (
            <motion.div
              key={i}
              layout
              transition={{ duration: 0.3, ease: EASE }}
              style={{
                width: i === screen ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === screen ? C.sage : i < screen ? C.sageLight : `${C.charcoal}15`,
              }}
            />
          ))}
        </div>
      )}

      {/* Back button */}
      {screen > 0 && !submitted && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={prev}
          className="fixed top-6 left-6 z-50 flex items-center gap-1.5 text-sm transition-colors cursor-pointer"
          style={{ color: C.charcoalLight }}
          onMouseEnter={e => (e.currentTarget.style.color = C.charcoal)}
          onMouseLeave={e => (e.currentTarget.style.color = C.charcoalLight)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="min-h-[100dvh] flex items-center justify-center px-5 py-20"
        >
          <div className="w-full max-w-xl">
            {screen === 0 && <Screen1Intent form={form} update={update} next={next} />}
            {screen === 1 && <Screen2Audience form={form} update={update} next={next} />}
            {screen === 2 && <Screen3Pain form={form} update={update} next={next} />}
            {screen === 3 && <Screen4Acknowledgment form={form} ackLoading={ackLoading} next={next} />}
            {screen === 4 && <Screen5Hope form={form} update={update} next={next} />}
            {screen === 5 && <Screen6Details form={form} update={update} next={next} />}
            {screen === 6 && (
              <Screen7Audio
                form={form}
                recording={recording}
                recordingTime={recordingTime}
                audioPreviewUrl={audioPreviewUrl}
                startRecording={startRecording}
                stopRecording={stopRecording}
                clearAudio={clearAudio}
                handleFileUpload={handleFileUpload}
                next={next}
              />
            )}
            {screen === 7 && <Screen8Contact form={form} update={update} submitting={submitting} onSubmit={handleSubmit} />}
            {screen === 8 && <Screen9Confirmation form={form} discoveryId={discoveryId} />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Shared sub-components
// ===========================================================================
function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1
      className="font-[family-name:var(--font-serif)] text-[clamp(1.6rem,5vw,2.5rem)] leading-[1.15] tracking-tight mb-3"
      style={{ color: C.charcoal }}
    >
      {children}
    </h1>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-relaxed mb-8" style={{ color: C.charcoalLight }}>{children}</p>;
}

function ContinueButton({ onClick, disabled, label = 'Continue' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
      style={{ background: C.sage, color: '#fff' }}
    >
      {label}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 block text-sm transition-colors cursor-pointer"
      style={{ color: C.charcoalLighter }}
      onMouseEnter={e => (e.currentTarget.style.color = C.charcoal)}
      onMouseLeave={e => (e.currentTarget.style.color = C.charcoalLighter)}
    >
      Skip this step
    </button>
  );
}

function CardOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
      style={{
        background: selected ? `${C.sage}0D` : C.cardBg,
        borderColor: selected ? C.sage : C.border,
        boxShadow: selected ? `0 0 0 1px ${C.sage}` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: selected ? `${C.sage}20` : `${C.charcoal}08` }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-medium leading-snug" style={{ color: C.charcoal }}>{title}</p>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: C.charcoalLight }}>{subtitle}</p>
        </div>
      </div>
    </motion.button>
  );
}

function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-4 py-3.5 rounded-xl border text-[15px] leading-relaxed resize-none transition-colors duration-200 focus:outline-none"
      style={{
        background: C.cardBg,
        color: C.charcoal,
        borderColor: C.border,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = C.sage)}
      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
    />
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  autoComplete,
  label,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
          {label} {required && <span style={{ color: C.rose }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl border text-[15px] transition-colors duration-200 focus:outline-none"
        style={{ background: C.cardBg, color: C.charcoal, borderColor: C.border }}
        onFocus={e => (e.currentTarget.style.borderColor = C.sage)}
        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
      />
      {hint && <p className="text-xs" style={{ color: C.charcoalLighter }}>{hint}</p>}
    </div>
  );
}

function ChipSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() =>
              onChange(isSelected ? selected.filter(s => s !== opt) : [...selected, opt])
            }
            className="px-4 py-2 rounded-full text-sm border transition-all duration-200 cursor-pointer"
            style={{
              background: isSelected ? `${C.sage}15` : C.cardBg,
              borderColor: isSelected ? C.sage : C.border,
              color: isSelected ? C.sageDark : C.charcoalLight,
              fontWeight: isSelected ? 500 : 400,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border text-[15px] transition-colors duration-200 focus:outline-none appearance-none bg-no-repeat cursor-pointer"
      style={{
        background: C.cardBg,
        color: value ? C.charcoal : C.charcoalLighter,
        borderColor: C.border,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238A8A8A' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundPosition: 'right 16px center',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ===========================================================================
// Screen 1: Intent
// ===========================================================================
function Screen1Intent({
  form,
  update,
  next,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  next: () => void;
}) {
  function select(val: Intent) {
    update('intent', val);
    setTimeout(next, 300);
  }

  return (
    <>
      <Heading>What brings you here today?</Heading>
      <Sub>No wrong answer. Just pick the one that fits best.</Sub>
      <div className="space-y-3">
        <CardOption
          selected={form.intent === 'build'}
          onClick={() => select('build')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6M10 22h4M12 2v1M4.22 7.22l.71.71M1 14h2M19.78 7.22l-.71.71M23 14h-2" />
              <path d="M18 14a6 6 0 0 0-12 0c0 2.21 1.34 4.1 3.26 4.93.22.1.41.27.54.48l.2.59h4l.2-.59c.13-.21.32-.38.54-.48A6.01 6.01 0 0 0 18 14z" />
            </svg>
          }
          title="I have something specific I want built"
          subtitle="An app, a tool, a system — you know what you need, you just need someone to make it real."
        />
        <CardOption
          selected={form.intent === 'optimize'}
          onClick={() => select('optimize')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" />
              <path d="M22 2L13 11" />
              <path d="M16 2h6v6" />
            </svg>
          }
          title="I want AI to make things run better"
          subtitle="You're drowning in busywork, things are falling through the cracks, and you know there's a smarter way."
        />
        <CardOption
          selected={form.intent === 'unsure'}
          onClick={() => select('unsure')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.rose} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16.24 7.76l-1.06 1.06M12 2v2M2 12h2M20 12h2M12 20v2M7.76 16.24l-1.06 1.06" />
              <path d="M12 12l4-4" />
            </svg>
          }
          title="I'm not sure yet — I just know something needs to change"
          subtitle="That's the most honest answer. Let's figure it out together."
        />
      </div>
    </>
  );
}

// ===========================================================================
// Screen 2: Audience
// ===========================================================================
function Screen2Audience({
  form,
  update,
  next,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  next: () => void;
}) {
  function select(val: Audience) {
    update('audience', val);
    setTimeout(next, 300);
  }

  return (
    <>
      <Heading>Who is this for?</Heading>
      <Sub>This helps me tailor what comes next.</Sub>
      <div className="space-y-3">
        <CardOption
          selected={form.audience === 'personal'}
          onClick={() => select('personal')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.rose} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          title="Just me"
          subtitle="Personal productivity, your own workflow, your own life."
        />
        <CardOption
          selected={form.audience === 'business'}
          onClick={() => select('business')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a4 4 0 0 0-8 0v2" />
            </svg>
          }
          title="My business or team"
          subtitle="Operations, processes, the stuff that keeps the machine running."
        />
        <CardOption
          selected={form.audience === 'both'}
          onClick={() => select('both')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="12" r="5" />
              <circle cx="16" cy="12" r="5" />
            </svg>
          }
          title="Both — my work and life are connected"
          subtitle="When one gets better, both get better."
        />
      </div>
    </>
  );
}

// ===========================================================================
// Screen 3: Pain question (varies by path)
// ===========================================================================
function Screen3Pain({
  form,
  update,
  next,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  next: () => void;
}) {
  const audience = form.intent === 'unsure' ? 'unsure' : form.audience;

  const questions: Record<string, { heading: string; placeholder: string }> = {
    personal: {
      heading: "What's the one thing that drains your energy every single day? The thing you keep saying you'll fix but never do?",
      placeholder: "I spend hours every week on...",
    },
    business: {
      heading: "Where does your team lose the most time, money, or momentum? What keeps breaking no matter how many times you try to fix it?",
      placeholder: "We keep running into...",
    },
    both: {
      heading: "When you think about your typical week — what's the thing that makes you think 'there has to be a better way'?",
      placeholder: "The thing that frustrates me most is...",
    },
    unsure: {
      heading: "What's frustrating you right now? Don't overthink it — just tell me what's on your mind.",
      placeholder: "What's been on my mind is...",
    },
  };

  const q = questions[audience || 'unsure'];

  return (
    <>
      <Heading>{q.heading}</Heading>
      <p className="text-sm mb-6" style={{ color: C.charcoalLight }}>
        Be specific. The more honest you are, the more useful my response will be.
      </p>
      <FormTextarea
        value={form.painText}
        onChange={v => update('painText', v)}
        placeholder={q.placeholder}
        rows={6}
      />
      <ContinueButton onClick={next} disabled={!form.painText.trim()} />
    </>
  );
}

// ===========================================================================
// Screen 4: Dynamic acknowledgment
// ===========================================================================
function Screen4Acknowledgment({
  form,
  ackLoading,
  next,
}: {
  form: FunnelData;
  ackLoading: boolean;
  next: () => void;
}) {
  // If no acknowledgment and not loading, skip to next screen
  useEffect(() => {
    if (!ackLoading && !form.acknowledgmentText) {
      const t = setTimeout(next, 200);
      return () => clearTimeout(t);
    }
  }, [ackLoading, form.acknowledgmentText, next]);

  if (ackLoading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-8 h-8 border-2 rounded-full mx-auto mb-4"
          style={{ borderColor: `${C.sage}30`, borderTopColor: C.sage }}
        />
        <p className="text-sm" style={{ color: C.charcoalLight }}>Reading what you shared...</p>
      </div>
    );
  }

  if (!form.acknowledgmentText) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="p-6 rounded-2xl mb-6"
        style={{ background: `${C.sage}0D`, border: `1px solid ${C.sage}30` }}
      >
        <p className="text-[15px] leading-relaxed italic" style={{ color: C.charcoal }}>
          &ldquo;{form.acknowledgmentText}&rdquo;
        </p>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: EASE }}
        className="text-sm leading-relaxed"
        style={{ color: C.charcoalLight }}
      >
        You&apos;re not alone in this. Let&apos;s talk about where you want to go.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <ContinueButton onClick={next} />
      </motion.div>
    </>
  );
}

// ===========================================================================
// Screen 5: Hope question
// ===========================================================================
function Screen5Hope({
  form,
  update,
  next,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  next: () => void;
}) {
  return (
    <>
      <Heading>
        Imagine it&apos;s 6 months from now and this problem is completely solved. What does your day look like?
      </Heading>
      <Sub>Paint the picture. This helps me understand what success looks like for you.</Sub>
      <FormTextarea
        value={form.hopeText}
        onChange={v => update('hopeText', v)}
        placeholder="With the time and energy I got back, I'd be..."
        rows={6}
      />
      <ContinueButton onClick={next} disabled={!form.hopeText.trim()} />
    </>
  );
}

// ===========================================================================
// Screen 6: Path-specific details
// ===========================================================================
function Screen6Details({
  form,
  update,
  next,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  next: () => void;
}) {
  const detailPath = getDetailPath(form.intent, form.audience);

  if (detailPath === 'app') {
    return (
      <>
        <Heading>Tell me about what you want to build.</Heading>
        <Sub>Don&apos;t worry about technical details — just describe what a user would experience.</Sub>
        <div className="space-y-5">
          <FormTextarea
            value={form.appDescription}
            onChange={v => update('appDescription', v)}
            placeholder="When someone opens it, they'd be able to..."
            rows={5}
          />
          <SelectDropdown
            value={form.appUsers}
            onChange={v => update('appUsers', v)}
            placeholder="Who would use it?"
            options={[
              { value: 'just_me', label: 'Just me' },
              { value: 'my_team', label: 'My team' },
              { value: 'customers', label: 'My customers' },
              { value: 'public', label: 'The public' },
            ]}
          />
          <FormInput
            value={form.appExisting}
            onChange={v => update('appExisting', v)}
            placeholder="e.g., I've been using spreadsheets, or nothing exists yet"
            label="Does anything like this exist already?"
          />
        </div>
        <ContinueButton onClick={next} disabled={!form.appDescription.trim()} />
      </>
    );
  }

  if (detailPath === 'business_ai') {
    return (
      <>
        <Heading>A few more details about your setup.</Heading>
        <Sub>This helps me understand what you&apos;re working with today.</Sub>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              What tools does your team rely on?
            </label>
            <ChipSelect
              options={['Google Workspace', 'Slack', 'HubSpot', 'Salesforce', 'QuickBooks', 'Notion', 'Asana', 'Excel', 'Custom software', 'Other']}
              selected={form.businessTools}
              onChange={v => update('businessTools', v)}
            />
          </div>
          <SelectDropdown
            value={form.teamSize}
            onChange={v => update('teamSize', v)}
            placeholder="How big is your team?"
            options={[
              { value: 'just_me', label: 'Just me' },
              { value: '2-5', label: '2-5 people' },
              { value: '6-20', label: '6-20 people' },
              { value: '21-50', label: '21-50 people' },
              { value: '50+', label: '50+' },
            ]}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              Have you tried any AI tools before? What happened?
            </label>
            <FormTextarea
              value={form.aiExperience}
              onChange={v => update('aiExperience', v)}
              placeholder="Optional — but helpful context"
              rows={3}
            />
          </div>
        </div>
        <ContinueButton onClick={next} />
      </>
    );
  }

  if (detailPath === 'personal_ai') {
    return (
      <>
        <Heading>What are you working with today?</Heading>
        <Sub>Knowing your current tools helps me suggest the right approach.</Sub>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              How do you stay organized right now?
            </label>
            <ChipSelect
              options={['Calendar', 'Notes app', 'Spreadsheets', 'Nothing really', 'Other']}
              selected={form.personalTools}
              onChange={v => update('personalTools', v)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              What have you tried that didn&apos;t stick?
            </label>
            <FormTextarea
              value={form.personalTriedFailed}
              onChange={v => update('personalTriedFailed', v)}
              placeholder="Optional — apps, systems, habits that fizzled out"
              rows={3}
            />
          </div>
        </div>
        <ContinueButton onClick={next} />
      </>
    );
  }

  if (detailPath === 'both_ai') {
    return (
      <>
        <Heading>Tell me a bit about your situation.</Heading>
        <Sub>When work and life are connected, the right system makes everything easier.</Sub>
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              What do you do for work, and what&apos;s overwhelming right now?
            </label>
            <FormTextarea
              value={form.bothWorkOverview}
              onChange={v => update('bothWorkOverview', v)}
              placeholder="I run a... / I work as a... and the thing that's killing me is..."
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: C.charcoalLight }}>
              What tools does your team use?
            </label>
            <ChipSelect
              options={['Google Workspace', 'Slack', 'HubSpot', 'Salesforce', 'QuickBooks', 'Notion', 'Asana', 'Excel', 'Custom software', 'Other']}
              selected={form.bothTools}
              onChange={v => update('bothTools', v)}
            />
          </div>
        </div>
        <ContinueButton onClick={next} disabled={!form.bothWorkOverview.trim()} />
      </>
    );
  }

  // Unsure path
  return (
    <>
      <Heading>Let&apos;s start with what your day looks like.</Heading>
      <Sub>Walk me through it. The patterns usually reveal the opportunities.</Sub>
      <div className="space-y-5">
        <FormTextarea
          value={form.unsureDayOverview}
          onChange={v => update('unsureDayOverview', v)}
          placeholder="I wake up and... / My typical day involves..."
          rows={5}
        />
        <FormInput
          value={form.unsureMagicWand}
          onChange={v => update('unsureMagicWand', v)}
          placeholder="If I could snap my fingers, I'd automate..."
          label="If you could wave a magic wand and automate one thing, what would it be?"
        />
      </div>
      <ContinueButton onClick={next} disabled={!form.unsureDayOverview.trim()} />
    </>
  );
}

// ===========================================================================
// Screen 7: Audio
// ===========================================================================
function Screen7Audio({
  form,
  recording,
  recordingTime,
  audioPreviewUrl,
  startRecording,
  stopRecording,
  clearAudio,
  handleFileUpload,
  next,
}: {
  form: FunnelData;
  recording: boolean;
  recordingTime: number;
  audioPreviewUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  clearAudio: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  next: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mins = Math.floor(recordingTime / 60);
  const secs = recordingTime % 60;

  return (
    <>
      <Heading>Want to tell me more?</Heading>
      <Sub>
        Record a quick voice message — just talk like you&apos;re explaining this to a friend.
        Most people find it easier to talk than type.
      </Sub>

      {!audioPreviewUrl && !recording && (
        <div className="space-y-3">
          <button
            onClick={startRecording}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
            style={{ background: C.cardBg, borderColor: C.border }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.sage)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${C.rose}20` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.roseDark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[15px] font-medium" style={{ color: C.charcoal }}>Record a voice message</p>
              <p className="text-sm" style={{ color: C.charcoalLight }}>Tap to start recording</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
            style={{ background: C.cardBg, borderColor: C.border }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.sage)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${C.gold}20` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.goldDark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[15px] font-medium" style={{ color: C.charcoal }}>Upload an audio file</p>
              <p className="text-sm" style={{ color: C.charcoalLight }}>MP3, M4A, WAV, WebM</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {recording && (
        <div className="text-center py-8">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${C.rose}20` }}
          >
            <div className="w-12 h-12 rounded-full" style={{ background: `${C.rose}60` }} />
          </motion.div>
          <p className="text-lg font-medium tabular-nums mb-4" style={{ color: C.charcoal }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </p>
          <button
            onClick={stopRecording}
            className="px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer"
            style={{ background: C.rose, color: '#fff' }}
          >
            Stop Recording
          </button>
        </div>
      )}

      {audioPreviewUrl && !recording && (
        <div className="p-5 rounded-2xl border" style={{ background: C.cardBg, borderColor: C.border }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${C.sage}20` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: C.charcoal }}>
              {form.audioBlob instanceof File ? form.audioBlob.name : 'Voice recording'}
            </p>
          </div>
          <audio controls src={audioPreviewUrl} className="w-full mb-3" style={{ height: 36 }} />
          <button
            onClick={clearAudio}
            className="text-sm cursor-pointer"
            style={{ color: C.charcoalLighter }}
            onMouseEnter={e => (e.currentTarget.style.color = C.roseDark)}
            onMouseLeave={e => (e.currentTarget.style.color = C.charcoalLighter)}
          >
            Remove and try again
          </button>
        </div>
      )}

      <p className="mt-4 text-xs" style={{ color: C.charcoalLighter }}>
        Everything stays private. This is optional but incredibly helpful.
      </p>

      <div className="flex items-center gap-4 mt-6">
        <ContinueButton onClick={next} label={audioPreviewUrl ? 'Continue' : 'Skip — I\'ve said enough'} />
      </div>
    </>
  );
}

// ===========================================================================
// Screen 8: Contact info
// ===========================================================================
function Screen8Contact({
  form,
  update,
  submitting,
  onSubmit,
}: {
  form: FunnelData;
  update: <K extends keyof FunnelData>(key: K, val: FunnelData[K]) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const canSubmit = form.name.trim().length > 0 && form.email.trim().length > 0 && form.email.includes('@');

  return (
    <>
      <Heading>Almost done. How should I reach you?</Heading>
      <Sub>I&apos;ll send your free AI analysis to this email.</Sub>
      <div className="space-y-4">
        <FormInput
          value={form.name}
          onChange={v => update('name', v)}
          placeholder="First and last name"
          label="Full name"
          required
          autoComplete="name"
        />
        <FormInput
          value={form.email}
          onChange={v => update('email', v)}
          placeholder="you@example.com"
          label="Email"
          type="email"
          required
          autoComplete="email"
        />
        <FormInput
          value={form.phone}
          onChange={v => update('phone', v)}
          placeholder="(optional)"
          label="Phone"
          type="tel"
          autoComplete="tel"
          hint="For scheduling — never spam."
        />
        <FormInput
          value={form.company}
          onChange={v => update('company', v)}
          placeholder="(optional)"
          label="Company or organization"
          autoComplete="organization"
        />
        <SelectDropdown
          value={form.referralSource}
          onChange={v => update('referralSource', v)}
          placeholder="How did you find me?"
          options={[
            { value: 'referral', label: 'Someone referred me' },
            { value: 'social', label: 'Social media' },
            { value: 'google', label: 'Google search' },
            { value: 'blog', label: 'Blog post' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="mt-8 w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-medium tracking-wide transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
        style={{ background: C.sage, color: '#fff' }}
      >
        {submitting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 rounded-full"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
            />
            Sending...
          </>
        ) : (
          <>
            Send it over
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="mt-4 text-xs text-center" style={{ color: C.charcoalLighter }}>
        Your responses go directly to Zev. No one else sees them. Free, no commitment.
      </p>
    </>
  );
}

// ===========================================================================
// Screen 9: Confirmation
// ===========================================================================
function Screen9Confirmation({
  form,
  discoveryId,
}: {
  form: FunnelData;
  discoveryId: string | null;
}) {
  const firstName = form.name.trim().split(/\s+/)[0] || 'friend';

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-8"
        style={{ borderColor: C.sage }}
      >
        <motion.svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke={C.sage}
          strokeWidth={2}
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
        className="font-[family-name:var(--font-serif)] text-[clamp(1.6rem,5vw,2.5rem)] leading-[1.15] tracking-tight"
        style={{ color: C.charcoal }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
      >
        {firstName}, your free AI analysis is on its way.
      </motion.h1>

      <motion.p
        className="mt-4 text-base leading-relaxed max-w-md mx-auto"
        style={{ color: C.charcoalLight }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
      >
        I looked into your situation and put together something specific for you — not a template, a real response based on what you shared.
      </motion.p>

      {discoveryId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          className="mt-6 inline-block"
        >
          <a
            href={`/discovery/${discoveryId}`}
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: C.sage }}
            onMouseEnter={e => (e.currentTarget.style.color = C.sageDark)}
            onMouseLeave={e => (e.currentTarget.style.color = C.sage)}
          >
            View your personalized page &rarr;
          </a>
        </motion.div>
      )}

      {/* Subtle upsell */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
        className="mt-10 p-6 rounded-2xl text-left max-w-md mx-auto"
        style={{ background: `${C.gold}08`, border: `1px solid ${C.gold}25` }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: C.goldDark }}>
          Want the full picture?
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: C.charcoalLight }}>
          I also offer a personalized AI roadmap — a detailed, step-by-step implementation plan built specifically for your situation. Specific tools, timelines, and decision points mapped to what you told me. $499, delivered within 24 hours. And it credits toward any future engagement.
        </p>
        <a
          href="/services"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: C.gold }}
          onMouseEnter={e => (e.currentTarget.style.color = C.goldDark)}
          onMouseLeave={e => (e.currentTarget.style.color = C.gold)}
        >
          Learn more &rarr;
        </a>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1, ease: EASE }}
        className="mt-8 text-sm"
        style={{ color: C.charcoalLighter }}
      >
        Either way, check your email. I think you&apos;ll find it useful.
      </motion.p>
    </div>
  );
}
