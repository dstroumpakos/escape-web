'use client';

import { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function ContactPage() {
  const { t } = useTranslation();

  const contactInfo = [
    {
      icon: Mail,
      label: t('contact.info_email'),
      value: 'hello@unlocked.gr',
      href: 'mailto:hello@unlocked.gr',
    },
    {
      icon: Phone,
      label: t('contact.info_phone'),
      value: '+30 698 379 5767',
      href: 'tel:+306983795767',
    },
    {
      icon: MapPin,
      label: t('contact.info_location'),
      value: 'Athens, Greece',
      href: '#',
    },
    {
      icon: Clock,
      label: t('contact.info_hours'),
      value: 'Mon-Fri 9:00-18:00',
      href: '#',
    },
  ];

  const faqs = [
    {
      q: t('contact.faq1_q'),
      a: t('contact.faq1_a'),
    },
    {
      q: t('contact.faq2_q'),
      a: t('contact.faq2_a'),
    },
    {
      q: t('contact.faq3_q'),
      a: t('contact.faq3_a'),
    },
    {
      q: t('contact.faq4_q'),
      a: t('contact.faq4_a'),
    },
    {
      q: t('contact.faq5_q'),
      a: t('contact.faq5_a'),
    },
    {
      q: t('contact.faq6_q'),
      a: t('contact.faq6_a'),
    },
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Send via mailto as a functional fallback
      const subject = encodeURIComponent(`[${formData.subject}] Contact from ${formData.name}`);
      const body = encodeURIComponent(`From: ${formData.name} (${formData.email})\n\nSubject: ${formData.subject}\n\n${formData.message}`);
      window.open(`mailto:hello@unlocked.gr?subject=${subject}&body=${body}`, '_self');
      // Brief delay for UX
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
    } catch {
      // silent fallback
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg via-brand-bg to-brand-dark" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-red/10 border border-brand-red/20 mb-6">
            <MessageSquare className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="section-heading mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-brand-text-secondary max-w-xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {contactInfo.map((info, i) => (
              <a
                key={i}
                href={info.href}
                className="card p-5 text-center hover:border-brand-red/30 transition-all group"
              >
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brand-red/10 mb-3 group-hover:bg-brand-red/20 transition-colors">
                  <info.icon className="w-5 h-5 text-brand-red" />
                </div>
                <div className="text-xs text-brand-text-muted mb-1">
                  {info.label}
                </div>
                <div className="text-sm font-medium">{info.value}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="card p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                      <Send className="w-7 h-7 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {t('contact.sent')}
                    </h3>
                    <p className="text-brand-text-secondary text-sm mb-6">
                      {t('contact.sent_desc')}
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          subject: 'general',
                          message: '',
                        });
                      }}
                      className="btn-ghost"
                    >
                      {t('contact.send_another')}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold mb-6">
                      {t('contact.form_title')}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                            {t('contact.form_name')}
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder={t('contact.form_name_placeholder')}
                            className="input-field"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                            {t('contact.form_email')}
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            placeholder={t('contact.form_email_placeholder')}
                            className="input-field"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                          {t('contact.form_subject')}
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subject: e.target.value,
                            })
                          }
                          className="input-field"
                        >
                          <option value="general">{t('contact.subject_general')}</option>
                          <option value="booking">{t('contact.subject_booking')}</option>
                          <option value="business">{t('contact.subject_business')}</option>
                          <option value="feedback">{t('contact.subject_feedback')}</option>
                          <option value="bug">{t('contact.subject_bug')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-brand-text-secondary">
                          {t('contact.form_message')}
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          placeholder={t('contact.form_message_placeholder')}
                          rows={5}
                          className="input-field resize-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            {t('contact.send')}
                            <Send className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business CTA */}
              <div className="card p-6 glow-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-red" />
                  </div>
                  <h3 className="font-semibold">{t('contact.for_businesses')}</h3>
                </div>
                <p className="text-sm text-brand-text-secondary mb-4">
                  {t('contact.for_businesses_desc')}
                </p>
                <a
                  href="/about#for-businesses"
                  className="text-brand-red text-sm font-medium hover:text-brand-red-light flex items-center gap-1 transition-colors"
                >
                  {t('contact.learn_more')}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Map placeholder */}
              <div className="card overflow-hidden">
                <div className="h-48 bg-brand-surface flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-brand-red mx-auto mb-2" />
                    <p className="text-sm text-brand-text-muted">
                      Athens, Greece
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 bg-brand-dark py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-red/10 mb-4">
              <HelpCircle className="w-6 h-6 text-brand-red" />
            </div>
            <h2 className="section-heading mb-4">
              {t('contact.faq_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-brand-surface/30 transition-colors"
                >
                  <span className="font-medium text-sm pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-brand-text-muted shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === i ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <p className="px-5 pb-5 text-sm text-brand-text-secondary leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
