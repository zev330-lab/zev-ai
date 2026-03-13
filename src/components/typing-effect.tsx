'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHRASES = [
  'I build AI systems.',
  'I automate workflows.',
  'I deploy intelligent agents.',
  'I transform businesses.',
];

export function TypingEffect() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = PHRASES[phraseIndex];

  const tick = useCallback(() => {
    if (!isDeleting) {
      if (charIndex < currentPhrase.length) {
        setCharIndex(prev => prev + 1);
      } else {
        setTimeout(() => setIsDeleting(true), 2000);
        return;
      }
    } else {
      if (charIndex > 0) {
        setCharIndex(prev => prev - 1);
      } else {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % PHRASES.length);
      }
    }
  }, [charIndex, isDeleting, currentPhrase.length]);

  useEffect(() => {
    const speed = isDeleting ? 30 : 70;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, isDeleting]);

  return (
    <span className="inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={phraseIndex + '-' + charIndex}
          className="gradient-text"
        >
          {currentPhrase.slice(0, charIndex)}
        </motion.span>
      </AnimatePresence>
      <span className="inline-block w-[3px] h-[1em] bg-accent ml-0.5 animate-pulse align-middle" aria-hidden="true" />
    </span>
  );
}
