import {
  Unlock,
  Users,
  Target,
  Heart,
  Shield,
  Zap,
  Globe,
  Award,
  Building2,
  BarChart2,
  Calendar,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const values = [
  {
    icon: Heart,
    title: 'Passion for Puzzles',
    desc: 'We live and breathe escape rooms. Our team of enthusiasts curates only the best experiences.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    desc: 'Real reviews, verified ratings, and honest listings. What you see is what you get.',
  },
  {
    icon: Zap,
    title: 'Seamless Experience',
    desc: 'From discovery to escape — we focus on making every step effortless and enjoyable.',
  },
  {
    icon: Globe,
    title: 'Community First',
    desc: 'We build for the escape room community — players and businesses alike — with features driven by real needs.',
  },
];

const timeline = [
  { year: '2024', title: 'The Idea', desc: 'Two escape room enthusiasts dreamed of a better way to discover and book rooms.' },
  { year: '2024', title: 'First Prototype', desc: 'Built the mobile app with real-time booking, QR tickets, and social features.' },
  { year: '2025', title: 'Partner Network', desc: 'Onboarded 20+ escape room venues across Greece with our business portal.' },
  { year: '2025', title: 'Web Launch', desc: 'Expanded to the web — making UNLOCKED accessible from any device, anywhere.' },
];

const businessFeats = [
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Manage time slots, availability, and bookings with our real-time dashboard.' },
  { icon: QrCode, title: 'QR Check-In', desc: 'Validate bookings instantly by scanning QR codes — zero paperwork.' },
  { icon: BarChart2, title: 'Business Analytics', desc: 'Revenue reports, booking trends, and fill rates at your fingertips.' },
  { icon: Building2, title: 'Website Widget', desc: 'Embed our booking widget on your website and let customers book directly.' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
            <Unlock className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="section-heading mb-6">
            About <span className="text-gradient">UNLOCKED</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            We&apos;re on a mission to revolutionize how people discover, book, and
            experience escape rooms. One puzzle at a time.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-4">
                <Target className="w-6 h-6 text-brand-red" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Our Mission</h2>
              <p className="text-brand-text-secondary leading-relaxed">
                To create the ultimate platform connecting escape room
                enthusiasts with unforgettable experiences. We believe every
                puzzle solved and every room escaped brings people closer
                together.
              </p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-4">
                <Award className="w-6 h-6 text-brand-red" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">Our Vision</h2>
              <p className="text-brand-text-secondary leading-relaxed">
                To become the global go-to platform for escape room discovery
                and booking — empowering both players to find their next
                adventure and businesses to reach new audiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              What We <span className="text-gradient">Stand For</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-4">
                  <v.icon className="w-7 h-7 text-brand-red" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading mb-4">
              Our <span className="text-gradient">Journey</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-brand-border" />

            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-6 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-5 md:left-1/2 w-3 h-3 bg-brand-red rounded-full -translate-x-1/2 mt-2 ring-4 ring-brand-dark" />

                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <span className="text-brand-red font-display font-bold text-sm">
                      {item.year}
                    </span>
                    <h3 className="text-lg font-semibold mt-1 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-brand-text-secondary">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section id="for-businesses" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-red text-sm font-semibold uppercase tracking-wider">
              For Escape Room Businesses
            </span>
            <h2 className="section-heading mt-3 mb-4">
              Partner With <span className="text-gradient">UNLOCKED</span>
            </h2>
            <p className="section-subheading mx-auto">
              Everything you need to manage and grow your escape room business,
              all in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-10">
            {businessFeats.map((f, i) => (
              <div key={i} className="card p-6 flex gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-brand-text-secondary">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
            <Users className="w-7 h-7 text-brand-red" />
          </div>
          <h2 className="section-heading mb-4">Join the Team</h2>
          <p className="text-brand-text-secondary mb-8 leading-relaxed">
            We&apos;re always looking for passionate people to help us build the
            future of escape room experiences. If you love puzzles and
            technology, we&apos;d love to hear from you.
          </p>
          <Link href="/contact" className="btn-outline">
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
