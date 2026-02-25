'use client';

import { Building2, BarChart2, Calendar, QrCode, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Calendar,
    title: 'Smart Booking System',
    desc: 'Manage availability, time slots, and bookings in real-time with our intuitive dashboard.',
  },
  {
    icon: QrCode,
    title: 'QR Code Validation',
    desc: 'Scan customer QR codes at the door for instant booking verification — no paperwork needed.',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    desc: 'Track bookings, revenue, and player stats to grow your escape room business.',
  },
  {
    icon: Building2,
    title: 'Embeddable Widget',
    desc: 'Add our booking widget to your website and let customers book directly from your site.',
  },
];

export function ForBusinesses() {
  return (
    <section id="for-businesses" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <span className="inline-block text-brand-red text-sm font-semibold uppercase tracking-wider mb-3">
              For Businesses
            </span>
            <h2 className="section-heading mb-6">
              Grow Your Escape Room{' '}
              <span className="text-gradient">Business</span>
            </h2>
            <p className="text-brand-text-secondary mb-8 leading-relaxed">
              Join UNLOCKED as a partner venue and reach thousands of new
              customers. Our platform handles bookings, payments, and marketing
              — so you can focus on creating amazing escape experiences.
            </p>

            <div className="space-y-5 mb-8">
              {features.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{f.title}</h4>
                    <p className="text-sm text-brand-text-secondary">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="btn-primary inline-flex items-center gap-2"
            >
              Partner With Us
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Right illustration */}
          <div className="relative">
            <div className="absolute -inset-4 bg-brand-red/5 rounded-3xl blur-2xl" />
            <div className="relative card p-8 md:p-10">
              {/* Mock dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Business Dashboard</h3>
                  <span className="text-xs text-brand-text-muted">Today</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Bookings', value: '24' },
                    { label: 'Revenue', value: '€1,240' },
                    { label: 'Fill Rate', value: '87%' },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-brand-surface rounded-xl p-3 text-center"
                    >
                      <div className="text-lg font-bold text-brand-red">
                        {s.value}
                      </div>
                      <div className="text-xs text-brand-text-muted">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock chart bars */}
                <div className="bg-brand-surface rounded-xl p-4">
                  <div className="text-xs text-brand-text-muted mb-3">
                    Weekly Bookings
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 55, 80, 90, 70, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-brand-red/30 hover:bg-brand-red/50 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-brand-text-muted">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      )
                    )}
                  </div>
                </div>

                {/* Mock upcoming bookings */}
                <div className="space-y-2">
                  {[
                    { time: '14:00', room: 'Haunted Mansion', players: 4 },
                    { time: '15:30', room: 'Prison Break', players: 6 },
                    { time: '17:00', room: 'Egyptian Tomb', players: 3 },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-brand-surface/50 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-brand-red">
                          {b.time}
                        </span>
                        <span className="text-sm">{b.room}</span>
                      </div>
                      <span className="text-xs text-brand-text-muted">
                        {b.players} players
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
