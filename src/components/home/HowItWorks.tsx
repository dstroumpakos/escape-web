'use client';

import { Search, CalendarCheck, KeyRound, PartyPopper } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Discover Rooms',
    description:
      'Browse our curated collection of escape rooms. Filter by theme, difficulty, location, and more.',
    step: '01',
  },
  {
    icon: CalendarCheck,
    title: 'Book Instantly',
    description:
      'Pick your date and time, choose payment options, and secure your spot in seconds.',
    step: '02',
  },
  {
    icon: KeyRound,
    title: 'Play & Escape',
    description:
      'Show your QR code at the venue, solve puzzles with your team, and race against the clock.',
    step: '03',
  },
  {
    icon: PartyPopper,
    title: 'Earn Badges',
    description:
      'Climb the leaderboard, collect achievement badges, and share your victories on the social feed.',
    step: '04',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="section-heading mb-4">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="section-subheading mx-auto">
            From discovery to escape in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+48px)] w-[calc(100%-48px)] h-px bg-gradient-to-r from-brand-border to-transparent" />
              )}

              <div className="text-center">
                {/* Step number */}
                <span className="text-6xl font-display font-bold text-brand-surface/50 group-hover:text-brand-red/20 transition-colors">
                  {step.step}
                </span>

                {/* Icon */}
                <div className="relative -mt-6 mb-5 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 group-hover:bg-brand-red/20 group-hover:border-brand-red/40 transition-all">
                  <step.icon className="w-7 h-7 text-brand-red" />
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
