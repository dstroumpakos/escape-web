'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria K.',
    avatar: 'MK',
    role: 'Escape Enthusiast',
    rating: 5,
    text: "UNLOCKED completely changed how we find escape rooms! The booking is seamless and the variety of rooms is incredible. Can't recommend it enough.",
  },
  {
    name: 'Dimitris P.',
    avatar: 'DP',
    role: 'Team Leader',
    rating: 5,
    text: 'We use UNLOCKED for all our team building events. The leaderboard feature keeps everyone competitive and engaged. Brilliant platform!',
  },
  {
    name: 'Sophie L.',
    avatar: 'SL',
    role: 'Puzzle Solver',
    rating: 5,
    text: "The social feed is such a fun touch — love seeing other teams' reactions and sharing our escape times. It's like a community of adventurers.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="section-heading mb-4">
            What Players <span className="text-gradient">Say</span>
          </h2>
          <p className="section-subheading mx-auto">
            Join thousands of happy escape room enthusiasts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="card p-6 md:p-8 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-border/30" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 text-brand-gold fill-brand-gold"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-brand-text-secondary text-sm leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-red/20 flex items-center justify-center text-brand-red text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-brand-text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
