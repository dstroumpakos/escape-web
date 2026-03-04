'use client';

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
import { useTranslation } from '@/lib/i18n';
import { AnimateIn, StaggerContainer, StaggerItem, Floating } from '@/components/animations/AnimateIn';

export default function AboutPage() {
  const { t } = useTranslation();

  const values = [
    {
      icon: Heart,
      title: t('about.value1_title'),
      desc: t('about.value1_desc'),
    },
    {
      icon: Shield,
      title: t('about.value2_title'),
      desc: t('about.value2_desc'),
    },
    {
      icon: Zap,
      title: t('about.value3_title'),
      desc: t('about.value3_desc'),
    },
    {
      icon: Globe,
      title: t('about.value4_title'),
      desc: t('about.value4_desc'),
    },
  ];

  const timeline = [
    { year: t('about.timeline1_year'), title: t('about.timeline1_title'), desc: t('about.timeline1_desc') },
    { year: t('about.timeline2_year'), title: t('about.timeline2_title'), desc: t('about.timeline2_desc') },
    { year: t('about.timeline3_year'), title: t('about.timeline3_title'), desc: t('about.timeline3_desc') },
    { year: t('about.timeline4_year'), title: t('about.timeline4_title'), desc: t('about.timeline4_desc') },
  ];

  const businessFeats = [
    { icon: Calendar, title: t('about.biz_feature1_title'), desc: t('about.biz_feature1_desc') },
    { icon: QrCode, title: t('about.biz_feature2_title'), desc: t('about.biz_feature2_desc') },
    { icon: BarChart2, title: t('about.biz_feature3_title'), desc: t('about.biz_feature3_desc') },
    { icon: Building2, title: t('about.biz_feature4_title'), desc: t('about.biz_feature4_desc') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn animation="scaleIn">
            <Floating>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
                <Unlock className="w-8 h-8 text-brand-red" />
              </div>
            </Floating>
          </AnimateIn>
          <AnimateIn animation="fadeUp" delay={0.15}>
            <h1 className="section-heading mb-6">
              {t('about.title')} <span className="text-gradient">{t('about.title_highlight')}</span>
            </h1>
          </AnimateIn>
          <AnimateIn animation="fadeUp" delay={0.3}>
            <p className="text-lg md:text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
              {t('about.hero_subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <AnimateIn animation="fadeRight">
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-4">
                  <Target className="w-6 h-6 text-brand-red" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">{t('about.our_mission')}</h2>
                <p className="text-brand-text-secondary leading-relaxed">
                  {t('about.mission_text')}
                </p>
              </div>
            </AnimateIn>
            <AnimateIn animation="fadeLeft" delay={0.2}>
              <div>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-4">
                  <Award className="w-6 h-6 text-brand-red" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">{t('about.our_vision')}</h2>
                <p className="text-brand-text-secondary leading-relaxed">
                  {t('about.vision_text')}
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp" className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('about.what_we_stand_for')}
            </h2>
          </AnimateIn>
          <StaggerContainer stagger={0.12} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <StaggerItem key={i} animation="fadeUp">
              <div className="card p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-4">
                  <v.icon className="w-7 h-7 text-brand-red" />
                </div>
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-brand-text-secondary leading-relaxed">
                  {v.desc}
                </p>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp" className="text-center mb-14">
            <h2 className="section-heading mb-4">
              {t('about.our_journey')}
            </h2>
          </AnimateIn>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-brand-border" />

            <div className="space-y-12">
              {timeline.map((item, i) => (
                <AnimateIn key={i} animation={i % 2 === 0 ? 'fadeRight' : 'fadeLeft'} delay={i * 0.15}>
                <div
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
                </AnimateIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section id="for-businesses" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn animation="fadeUp" className="text-center mb-14">
            <span className="text-brand-red text-sm font-semibold uppercase tracking-wider">
              {t('about.for_businesses_label')}
            </span>
            <h2 className="section-heading mt-3 mb-4">
              {t('about.partner_title')} <span className="text-gradient">{t('about.partner_title_highlight')}</span>
            </h2>
            <p className="section-subheading mx-auto">
              {t('about.partner_subtitle')}
            </p>
          </AnimateIn>

          <StaggerContainer stagger={0.12} className="grid sm:grid-cols-2 gap-6 mb-10">
            {businessFeats.map((f, i) => (
              <StaggerItem key={i} animation="fadeUp">
              <div className="card p-6 flex gap-4 hover:-translate-y-1 transition-transform duration-300">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-brand-red" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-brand-text-secondary">{f.desc}</p>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <div className="text-center">
            <Link href="/company/register" className="btn-primary inline-flex items-center gap-2">
              {t('about.become_partner')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateIn animation="scaleIn">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
              <Users className="w-7 h-7 text-brand-red" />
            </div>
          </AnimateIn>
          <AnimateIn animation="fadeUp" delay={0.15}>
            <h2 className="section-heading mb-4">{t('about.join_team')}</h2>
            <p className="text-brand-text-secondary mb-8 leading-relaxed">
              {t('about.join_team_desc')}
            </p>
            <Link href="/contact" className="btn-outline">
              {t('about.get_in_touch')}
            </Link>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
