'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AI_RESPONSES: Record<string, string> = {
  'what do you do': "I build production AI systems for businesses. Not slide decks — real, deployed software. My flagship project is a 2,000+ page real estate platform with 18 AI agents, automated lead scoring, and a streaming AI concierge. I help businesses replicate that kind of transformation.",
  'what is ai readiness': "An AI Readiness Assessment is a comprehensive audit of your business operations. I map your workflows, audit your tools, score AI opportunities by ROI, and deliver a prioritized 90-day implementation roadmap. It answers the question: 'Where should we start with AI?' — with specifics, not buzzwords.",
  'how much does it cost': "Three tiers: AI Readiness Assessment ($2,500–$5,000), AI Workflow Implementation ($5,000–$25,000 per system), and Fractional AI Officer ($5,000–$10,000/month for ongoing transformation). Every engagement starts with a free discovery call.",
  'tell me about steinmetz real estate': "SteinmetzRealEstate.com is a 2,000+ page Next.js platform I built entirely with AI-assisted development. It runs 18 AI agents including automated lead scoring, an AI neighborhood concierge with streaming chat, SOI nurture automation, reputation management, and role-based dashboards — all on a Supabase backend with row-level security.",
  'what tools do you use': "My core stack: Claude & Claude Code for AI development, Next.js + TypeScript for web platforms, Supabase for backend, Vercel for deployment, and the Vercel AI SDK for streaming AI features. I also work with automation tools, cron systems, and custom data pipelines.",
  'help': "Try asking me:\n• What do you do?\n• What is AI readiness?\n• How much does it cost?\n• Tell me about Steinmetz Real Estate\n• What tools do you use?\n\nOr type anything — I'll do my best.",
};

function findResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, value] of Object.entries(AI_RESPONSES)) {
    if (lower.includes(key) || key.includes(lower)) return value;
  }
  if (lower.includes('cost') || lower.includes('price') || lower.includes('pricing')) return AI_RESPONSES['how much does it cost'];
  if (lower.includes('tool') || lower.includes('stack') || lower.includes('tech')) return AI_RESPONSES['what tools do you use'];
  if (lower.includes('steinmetz') || lower.includes('real estate')) return AI_RESPONSES['tell me about steinmetz real estate'];
  if (lower.includes('ready') || lower.includes('assess') || lower.includes('audit')) return AI_RESPONSES['what is ai readiness'];
  if (lower.includes('do') || lower.includes('build') || lower.includes('service')) return AI_RESPONSES['what do you do'];
  return "Interesting question. In a production version, I'd be powered by Claude and could answer anything about AI consulting. For now, try asking 'help' to see what I can discuss. Or better yet — book a discovery call and ask me in person.";
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AITerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hey — I'm Zev's AI assistant. Ask me anything about AI consulting, my services, or what I've built. Type 'help' for suggestions." },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Simulate AI "thinking" delay
    const response = findResponse(userMessage);
    const delay = Math.min(500 + response.length * 8, 2000);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, delay);
  }, [input, isTyping]);

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:bg-accent-light transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden border border-surface-border bg-surface shadow-2xl"
            role="dialog"
            aria-label="AI Assistant"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-border flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">zev.ai assistant</p>
                <p className="text-xs text-muted">AI-powered • Ask me anything</p>
              </div>
              <div className="ml-auto flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-surface-border" aria-hidden="true" />
                <span className="w-2.5 h-2.5 rounded-full bg-surface-border" aria-hidden="true" />
                <span className="w-2.5 h-2.5 rounded-full bg-surface-border" aria-hidden="true" />
              </div>
            </div>

            {/* Messages */}
            <div className="h-[320px] overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-sm'
                        : 'bg-surface-light text-foreground rounded-bl-sm border border-surface-border'
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-surface-light rounded-2xl rounded-bl-sm px-4 py-3 border border-surface-border">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-surface-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about AI consulting..."
                  className="flex-1 bg-surface-light border border-surface-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                  aria-label="Type your message"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="rounded-xl bg-accent px-4 py-2.5 text-white text-sm font-medium hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
