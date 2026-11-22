'use client';

import { motion } from 'framer-motion';

interface HorrorHeadingProps {
  kicker?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  className?: string;
  align?: 'center' | 'left';
}

/** Section title: a typed kicker, a bone-white title, a blood highlight and a claw-scratch underline. */
export function HorrorHeading({ kicker, title, highlight, subtitle, className = '', align = 'center' }: HorrorHeadingProps) {
  const center = align === 'center';
  return (
    <div className={`${center ? 'text-center' : ''} mb-14 ${className}`}>
      {kicker && (
        <motion.div
          initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
          whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.1, ease: 'linear' }}
          className={`horror-label mb-4 flex items-center gap-3 ${center ? 'justify-center' : ''}`}
        >
          <span className="h-px w-8 bg-brand-red/60" />
          {kicker}
          <span className="h-px w-8 bg-brand-red/60" />
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
        className="section-heading mb-5"
      >
        {title}{' '}
        {highlight && (
          <span className="relative inline-block">
            <span className="text-gradient">{highlight}</span>
            {/* Claw scratch */}
            <svg
              aria-hidden
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
              className="absolute left-0 -bottom-2 w-full h-3 overflow-visible"
              fill="none"
              stroke="var(--color-brand-red)"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M${4 + i * 3} ${6 + i * 4} Q 100 ${2 + i * 5} ${196 - i * 6} ${8 + i * 3}`}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.6 + i * 0.12, ease: 'easeIn' }}
                  style={{ opacity: 0.9 - i * 0.2 }}
                />
              ))}
            </svg>
          </span>
        )}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className={`section-subheading ${center ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
