'use client';

import { useTranslation } from '@/lib/i18n';
import {
  BookOpen,
  CalendarDays,
  Clock,
  CreditCard,
  Star,
  Camera,
  QrCode,
  Code2,
  Trophy,
  Bell,
  Users,
  Zap,
  ShieldCheck,
  Timer,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-brand-surface rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-red" />
        </div>
        <span className="text-lg font-semibold flex-1">{title}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-brand-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-brand-text-secondary" />
        )}
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 text-sm text-brand-text-secondary leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-brand-text-secondary/60 min-w-[140px]">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function Badge({ children, color = 'red' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    red: 'bg-brand-red/10 text-brand-red',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

export default function DocsPage() {
  const { t, language } = useTranslation();
  const isGreek = language === 'el';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-brand-red" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {isGreek ? 'Τεκμηρίωση Πλατφόρμας' : 'Platform Documentation'}
            </h1>
            <p className="text-brand-text-secondary text-sm">
              {isGreek
                ? 'Οδηγός για όλες τις λειτουργίες της πλατφόρμας UNLOCKED'
                : 'A guide to every feature of the UNLOCKED platform'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* ─── 1. Booking System ─── */}
        <Section icon={CalendarDays} title={isGreek ? 'Σύστημα Κρατήσεων' : 'Booking System'} defaultOpen>
          <p>
            {isGreek
              ? 'Οι παίκτες επιλέγουν δωμάτιο, ημερομηνία, ώρα και αριθμό παικτών. Κάθε κράτηση λαμβάνει μοναδικό κωδικό κράτησης.'
              : 'Players select a room, date, time, and number of players. Each booking receives a unique booking code.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Κωδικοί Κράτησης' : 'Booking Codes'}
            </p>
            <InfoRow
              label={isGreek ? 'Πλατφόρμα' : 'Platform'}
              value={`UNL-XXXXXX (${isGreek ? 'κρατήσεις μέσω UNLOCKED' : 'bookings via UNLOCKED'})`}
            />
            <InfoRow
              label="Widget"
              value={`WEB-XXXXXX (${isGreek ? 'κρατήσεις μέσω widget' : 'bookings via widget'})`}
            />
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Καταστάσεις Κράτησης' : 'Booking Statuses'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{isGreek ? 'Προσεχής' : 'Upcoming'}</Badge>
              <Badge color="green">{isGreek ? 'Ολοκληρωμένη' : 'Completed'}</Badge>
              <Badge color="red">{isGreek ? 'Ακυρωμένη' : 'Cancelled'}</Badge>
              <Badge color="amber">{isGreek ? 'Εκκρεμεί Πληρωμή' : 'Pending Payment'}</Badge>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Όροι Πληρωμής' : 'Payment Terms'}
            </p>
            <p>
              {isGreek
                ? 'Κάθε δωμάτιο μπορεί να ρυθμιστεί με έναν από τους παρακάτω τρόπους πληρωμής:'
                : 'Each room can be configured with one of the following payment terms:'}
            </p>
            <div className="space-y-3 mt-2">
              <div className="flex gap-3">
                <Badge color="green">Full</Badge>
                <span>
                  {isGreek
                    ? '100% του συνόλου + €3.99 χρέωση υπηρεσίας μέσω Stripe'
                    : '100% of booking total + €3.99 service fee via Stripe'}
                </span>
              </div>
              <div className="flex gap-3">
                <Badge color="amber">Deposit 20%</Badge>
                <span>
                  {isGreek
                    ? '20% του συνόλου + €3.99 χρέωση υπηρεσίας μέσω Stripe · υπόλοιπο στην άφιξη'
                    : '20% of booking total + €3.99 service fee via Stripe — remainder due on arrival'}
                </span>
              </div>
              <div className="flex gap-3">
                <Badge color="blue">Pay on Arrival</Badge>
                <span>
                  {isGreek
                    ? 'Χωρίς χρέωση Stripe · η κράτηση δημιουργείται απευθείας'
                    : 'No Stripe charge — booking created directly'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-start gap-3">
            <Timer className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">
                {isGreek ? 'Αυτόματη ακύρωση μετά από 30 λεπτά' : 'Auto-cancellation after 30 minutes'}
              </p>
              <p className="mt-1">
                {isGreek
                  ? 'Αν ο παίκτης ξεκινήσει την πληρωμή Stripe αλλά δεν ολοκληρώσει, η κράτηση ακυρώνεται αυτόματα μετά από 30 λεπτά και το slot ξεκλειδώνει. Ο παίκτης μπορεί να επαναλάβει την πληρωμή αν η κράτηση εξακολουθεί σε κατάσταση "Εκκρεμεί Πληρωμή".'
                  : 'If a player starts the Stripe checkout but doesn\'t complete it, the booking is automatically cancelled after 30 minutes and the slot is freed. The player can retry the payment as long as the booking is still in "Pending Payment" status.'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Χρέωση Υπηρεσίας' : 'Service Fee'}
            </p>
            <p>
              {isGreek
                ? 'Σε κάθε πληρωμή Stripe προστίθεται χρέωση υπηρεσίας €3.99. Αυτή η χρέωση καλύπτει τη λειτουργία της πλατφόρμας και χρεώνεται στον παίκτη, όχι στην εταιρεία.'
                : 'A €3.99 service fee is added to every Stripe payment. This fee covers platform operations and is charged to the player, not to the company.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Αποτροπή Διπλών Κρατήσεων' : 'Double-Booking Prevention'}
            </p>
            <p>
              {isGreek
                ? 'Πριν από κάθε κράτηση, το σύστημα ελέγχει αν υπάρχει ήδη ενεργή κράτηση στο ίδιο δωμάτιο + ημερομηνία + ώρα. Αν ναι, η κράτηση απορρίπτεται.'
                : 'Before creating any booking, the system checks for an existing active booking at the same room + date + time. If one exists, the booking is rejected.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              {isGreek ? 'Email Επιβεβαίωσης' : 'Confirmation Emails'}
            </p>
            <p>
              {isGreek
                ? 'Μετά τη δημιουργία κράτησης (ή μετά την επιβεβαίωση πληρωμής), αποστέλλονται αυτόματα emails επιβεβαίωσης τόσο στον παίκτη όσο και στην εταιρεία. Επιπλέον, η Stripe αποστέλλει απόδειξη πληρωμής στον παίκτη.'
                : 'After booking creation (or payment confirmation), confirmation emails are automatically sent to both the player and the company. Additionally, Stripe sends a payment receipt to the player.'}
            </p>
          </div>
        </Section>

        {/* ─── 2. Reviews ─── */}
        <Section icon={Star} title={isGreek ? 'Σύστημα Αξιολογήσεων' : 'Review System'}>
          <p>
            {isGreek
              ? 'Μόνο παίκτες με ολοκληρωμένη κράτηση μπορούν να αξιολογήσουν ένα δωμάτιο.'
              : 'Only players with a completed booking can review a room.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex gap-3 items-center">
              <Star className="w-4 h-4 text-amber-400" />
              <span>
                {isGreek
                  ? 'Βαθμολογία 1-5 αστέρια — υποχρεωτική'
                  : 'Rating 1-5 stars — required'}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {isGreek
                  ? 'Κάθε αξιολόγηση είναι επιβεβαιωμένη (Verified) — συνδεδεμένη με πραγματική κράτηση'
                  : 'Every review is verified — linked to a real booking'}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>
                {isGreek
                  ? 'Μία αξιολόγηση ανά κράτηση — δεν επιτρέπονται διπλότυπα'
                  : 'One review per booking — duplicates are prevented'}
              </span>
            </div>
          </div>

          <p>
            {isGreek
              ? 'Η μέση βαθμολογία και ο αριθμός αξιολογήσεων ενημερώνονται αυτόματα στο δωμάτιο μετά από κάθε νέα αξιολόγηση.'
              : 'The average rating and review count are automatically updated on the room after every new review.'}
          </p>
        </Section>

        {/* ─── 3. Time Slots & Availability ─── */}
        <Section icon={Clock} title={isGreek ? 'Χρονικά Slots & Διαθεσιμότητα' : 'Time Slots & Availability'}>
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ημέρες Λειτουργίας' : 'Operating Days'}
            </p>
            <p>
              {isGreek
                ? 'Κάθε δωμάτιο έχει ρυθμισμένες ημέρες λειτουργίας. Αν ο παίκτης αναζητήσει ημέρα εκτός λειτουργίας, εμφανίζεται ως κλειστό.'
                : 'Each room has configured operating days. If a player searches for a non-operating day, the room is shown as closed.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Προεπιλεγμένα Slots' : 'Default Slots'}
            </p>
            <p>
              {isGreek
                ? 'Ορίστε ώρες και τιμές ως προεπιλεγμένο πρόγραμμα. Αυτές χρησιμοποιούνται αυτόματα αν δεν υπάρχουν ειδικές ρυθμίσεις για μια ημερομηνία.'
                : 'Set times and prices as a default schedule. These are used automatically when no custom slots exist for a given date.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ειδικά Slots ανά Ημερομηνία' : 'Custom Slots per Date'}
            </p>
            <p>
              {isGreek
                ? 'Μπορείτε να ορίσετε ειδικές ώρες, τιμές ή να κλείσετε μεμονωμένα slots σε συγκεκριμένες ημερομηνίες.'
                : 'You can set custom times, prices, or close individual slots on specific dates.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Overflow Slot' : 'Overflow Slot'}
            </p>
            <p>
              {isGreek
                ? 'Ένα bonus slot που εμφανίζεται μόνο όταν ΟΛΑ τα κανονικά slots είναι κλεισμένα. Ρυθμίζεται ανά δωμάτιο με ώρα, τιμή και ποιες μέρες είναι ενεργό.'
                : 'A bonus slot that only appears when ALL regular slots are booked. Configured per room with time, price, and which days it\'s active.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Τρόποι Τιμολόγησης' : 'Pricing Modes'}
            </p>
            <div className="space-y-2 mt-1">
              <div className="flex gap-3">
                <Badge color="blue">{isGreek ? 'Ανά Άτομο' : 'Per Person'}</Badge>
                <span>{isGreek ? 'Τιμή × αριθμός παικτών' : 'Price × number of players'}</span>
              </div>
              <div className="flex gap-3">
                <Badge color="purple">{isGreek ? 'Ανά Ομάδα' : 'Per Group'}</Badge>
                <span>
                  {isGreek
                    ? 'Κλιμακωτή τιμολόγηση ανά μέγεθος ομάδας (π.χ. 2 άτομα = €50, 3 = €42, ...)'
                    : 'Tiered pricing per group size (e.g., 2 players = €50, 3 = €42, ...)'}
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 4. Photo Branding ─── */}
        <Section icon={Camera} title={isGreek ? 'Φωτογραφίες & Branding' : 'Photo Branding'}>
          <p>
            {isGreek
              ? 'Ανεβάστε φωτογραφίες από ολοκληρωμένες κρατήσεις και εφαρμόστε αυτόματα τα branding στοιχεία της εταιρείας σας.'
              : 'Upload photos from completed bookings and automatically apply your company\'s branding elements.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ρυθμίσεις Branding' : 'Branding Settings'}
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>{isGreek ? 'Λογότυπο εταιρείας με επιλογή θέσης (πάνω αριστερά, πάνω δεξιά, κάτω αριστερά, κάτω δεξιά, κάτω κέντρο)' : 'Company logo with position choice (top-left, top-right, bottom-left, bottom-right, bottom-center)'}</li>
              <li>{isGreek ? 'Χρώμα brand' : 'Brand color'}</li>
              <li>{isGreek ? 'Αδιαφάνεια watermark (0% – 100%)' : 'Watermark opacity (0% – 100%)'}</li>
              <li>{isGreek ? 'Πρότυπο κειμένου (π.χ. "You escaped in {{time}}")' : 'Text template (e.g., "You escaped in {{time}}")'}</li>
              <li>{isGreek ? 'Full-frame overlay (διαφανές PNG)' : 'Full-frame overlay (transparent PNG)'}</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ροή Εργασίας' : 'Workflow'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="amber">Pending</Badge>
              <span className="text-brand-text-secondary/40">→</span>
              <Badge color="blue">Processing</Badge>
              <span className="text-brand-text-secondary/40">→</span>
              <Badge color="green">Ready</Badge>
            </div>
            <p className="mt-2">
              {isGreek
                ? 'Μόλις όλες οι φωτογραφίες μιας κράτησης είναι έτοιμες, ο παίκτης λαμβάνει ειδοποίηση "Τα Escape Moments σας είναι έτοιμα!" και μπορεί να τις κατεβάσει ή να τις μοιραστεί.'
                : 'Once all photos for a booking are ready, the player gets a notification "Your Escape Moments are ready!" and can download or share them.'}
            </p>
          </div>
        </Section>

        {/* ─── 5. QR Code Verification ─── */}
        <Section icon={QrCode} title={isGreek ? 'QR Code Επαλήθευσης' : 'QR Code Verification'}>
          <p>
            {isGreek
              ? 'Κάθε κράτηση δημιουργεί αυτόματα QR code από τον μοναδικό κωδικό κράτησης (π.χ. UNL-A1B2C3).'
              : 'Every booking automatically generates a QR code from the unique booking code (e.g., UNL-A1B2C3).'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex gap-3 items-start">
              <QrCode className="w-5 h-5 text-brand-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">
                  {isGreek ? 'Πώς λειτουργεί' : 'How it works'}
                </p>
                <p className="mt-1">
                  {isGreek
                    ? 'Σαρώστε το QR code του πελάτη στην πόρτα για instant επαλήθευση κράτησης — χωρίς χαρτιά. Το σύστημα εμφανίζει τα στοιχεία κράτησης, δωμάτιο και όνομα παίκτη.'
                    : 'Scan the customer\'s QR code at the door for instant booking verification — no paperwork needed. The system shows booking details, room info, and player name.'}
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 6. Booking Widget ─── */}
        <Section icon={Code2} title={isGreek ? 'Widget Κρατήσεων' : 'Booking Widget'}>
          <p>
            {isGreek
              ? 'Ενσωματώστε ένα widget κρατήσεων απευθείας στο site σας. Οι πελάτες μπορούν να κλείσουν χωρίς να χρειάζεται λογαριασμός UNLOCKED.'
              : 'Embed a booking widget directly on your website. Customers can book without needing an UNLOCKED account.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Χαρακτηριστικά' : 'Features'}
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>{isGreek ? 'Διαθεσιμότητα σε πραγματικό χρόνο' : 'Real-time availability'}</li>
              <li>{isGreek ? 'Κράτηση ως επισκέπτης (χωρίς λογαριασμό)' : 'Guest booking (no account required)'}</li>
              <li>{isGreek ? 'Αυτόματα emails επιβεβαίωσης' : 'Automatic confirmation emails'}</li>
              <li>{isGreek ? 'Φιλικό προς κινητά / responsive' : 'Mobile-friendly / responsive'}</li>
              <li>{isGreek ? 'Ειδοποιήσεις slot (slot alerts) για επισκέπτες' : 'Slot alerts for guests'}</li>
              <li>{isGreek ? 'Υποστήριξη τιμολόγησης ανά ομάδα' : 'Per-group pricing support'}</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ενσωμάτωση' : 'Integration'}
            </p>
            <p>
              {isGreek
                ? 'Απλά αντιγράψτε τον κώδικα ενσωμάτωσης από τις Ρυθμίσεις και επικολλήστε τον στο HTML του site σας. Το widget χρησιμοποιεί αυτόματα το όνομα, λογότυπο και τα δωμάτια της εταιρείας σας.'
                : 'Simply copy the embed code from Settings and paste it into your website\'s HTML. The widget automatically uses your company name, logo, and room configuration.'}
            </p>
          </div>
        </Section>

        {/* ─── 7. Slot Alerts ─── */}
        <Section icon={Bell} title={isGreek ? 'Ειδοποιήσεις Slot' : 'Slot Alerts'}>
          <p>
            {isGreek
              ? 'Οι παίκτες μπορούν να εγγραφούν σε ειδοποίηση για κλεισμένα slots. Αν μια κράτηση ακυρωθεί, οι εγγεγραμμένοι λαμβάνουν αυτόματα ειδοποίηση ότι το slot είναι πλέον διαθέσιμο.'
              : 'Players can subscribe to booked slots. When a booking is cancelled, subscribers automatically receive a notification that the slot is now available.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4">
            <p>
              {isGreek
                ? 'Υποστηρίζονται τόσο εγγεγραμμένοι παίκτες (in-app ειδοποίηση) όσο και επισκέπτες widget (email/phone).'
                : 'Supports both registered players (in-app notification) and widget guests (email/phone).'}
            </p>
          </div>
        </Section>

        {/* ─── 8. EA Partner Program ─── */}
        <Section icon={Sparkles} title={isGreek ? 'EA Partner Program' : 'EA Partner Program'}>
          <p>
            {isGreek
              ? 'Οι εταιρείες με ενεργή συνδρομή θεωρούνται EA (Early Access) Partners.'
              : 'Companies with an active subscription are considered EA (Early Access) Partners.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <ul className="space-y-2 list-disc pl-5">
              <li>
                {isGreek
                  ? 'Τα δωμάτια EA partners εμφανίζονται αυτόματα στο Featured Spotlight της αρχικής σελίδας'
                  : 'EA partner rooms are automatically included in the Featured Spotlight on the home page'}
              </li>
              <li>
                {isGreek
                  ? 'Ορίστε ημερομηνία κυκλοφορίας — οι Premium συνδρομητές μπορούν να κλείσουν έως 3 ημέρες νωρίτερα'
                  : 'Set a release date — Premium subscribers can book up to 3 days early'}
              </li>
              <li>
                {isGreek
                  ? 'Όταν προσθέτετε νέο δωμάτιο, οι Premium παίκτες λαμβάνουν ειδοποίηση'
                  : 'When you add a new room, Premium players receive a notification'}
              </li>
              <li>
                {isGreek
                  ? 'Εμφανίζεται badge "Early Access" στα δωμάτιά σας'
                  : '"Early Access" badge displayed on your rooms'}
              </li>
            </ul>
          </div>
        </Section>

        {/* ─── 9. Leaderboard & Escape Rate ─── */}
        <Section icon={Trophy} title={isGreek ? 'Πίνακας Κατάταξης & Ποσοστό Απόδρασης' : 'Leaderboard & Escape Rate'}>
          <p>
            {isGreek
              ? 'Η πλατφόρμα διατηρεί δημόσιο πίνακα κατάταξης παικτών και δωματίων.'
              : 'The platform maintains a public leaderboard for players and rooms.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Κατάταξη Παικτών' : 'Player Ranking'}
            </p>
            <p>
              {isGreek
                ? 'Οι παίκτες κατατάσσονται ανά αριθμό μοναδικών δωματίων που δραπέτευσαν. Σε ισοβαθμία, κερδίζει ο παίκτης με λιγότερες συνολικές προσπάθειες (καλύτερη αποτελεσματικότητα).'
                : 'Players are ranked by unique rooms escaped. In case of a tie, the player with fewer total attempts (better efficiency) wins.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Ποσοστό Απόδρασης Δωματίου' : 'Room Escape Rate'}
            </p>
            <p>
              {isGreek
                ? 'Υπολογίζεται ως: (ολοκληρωμένες κρατήσεις / σύνολο παρελθοντικών μη-ακυρωμένων κρατήσεων) × 100%. Εμφανίζεται στον πίνακα κατάταξης "Top Rooms".'
                : 'Calculated as: (completed bookings / total past non-cancelled bookings) × 100%. Shown in the "Top Rooms" leaderboard tab.'}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">
              {isGreek ? 'Badges' : 'Badges'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge color="amber">🏆 Champion</Badge>
              <Badge color="red">🔥 On Fire</Badge>
              <Badge color="purple">🧠 Mastermind</Badge>
              <Badge color="blue">⚡ Speed Demon</Badge>
              <Badge color="green">👥 Team Leader</Badge>
              <Badge color="blue">🌍 Explorer</Badge>
              <Badge color="amber">🎯 Perfectionist</Badge>
              <Badge color="purple">🌙 Night Owl</Badge>
            </div>
          </div>
        </Section>

        {/* ─── 10. Notifications ─── */}
        <Section icon={Bell} title={isGreek ? 'Ειδοποιήσεις' : 'Notifications'}>
          <p>
            {isGreek
              ? 'Όλες οι ειδοποιήσεις είναι τοπικοποιημένες (Ελληνικά & Αγγλικά) βάσει της προτίμησης γλώσσας του παίκτη.'
              : 'All notifications are localized (Greek & English) based on the player\'s language preference.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { type: 'booking', label: isGreek ? 'Επιβεβαίωση κράτησης' : 'Booking confirmation' },
                { type: 'cancelled', label: isGreek ? 'Ακύρωση κράτησης' : 'Booking cancelled' },
                { type: 'reminder', label: isGreek ? 'Υπενθύμιση κράτησης' : 'Booking reminder' },
                { type: 'slot_available', label: isGreek ? 'Slot διαθέσιμο' : 'Slot available' },
                { type: 'new_room', label: isGreek ? 'Νέο δωμάτιο (Premium)' : 'New room (Premium)' },
                { type: 'photos_ready', label: isGreek ? 'Φωτογραφίες έτοιμες' : 'Photos ready' },
                { type: 'friend_request', label: isGreek ? 'Αίτημα φιλίας' : 'Friend request' },
                { type: 'friend_accepted', label: isGreek ? 'Αποδοχή φιλίας' : 'Friend accepted' },
                { type: 'booking_invite', label: isGreek ? 'Πρόσκληση κράτησης' : 'Booking invite' },
                { type: 'promo', label: isGreek ? 'Προωθητική' : 'Promotional' },
                { type: 'system', label: isGreek ? 'Σύστημα' : 'System' },
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center gap-2 text-xs">
                  <span className="text-brand-red font-mono">{type}</span>
                  <span className="text-brand-text-secondary/40">—</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ─── 11. Plans & Pricing ─── */}
        <Section icon={CreditCard} title={isGreek ? 'Πλάνα & Τιμολόγηση' : 'Plans & Pricing'}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left pb-3 pr-4 text-brand-text-secondary font-medium"></th>
                  <th className="text-center pb-3 px-3">
                    <Badge color="blue">Starter</Badge>
                  </th>
                  <th className="text-center pb-3 px-3">
                    <Badge color="purple">Pro</Badge>
                  </th>
                  <th className="text-center pb-3 px-3">
                    <Badge color="red">Enterprise</Badge>
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {[
                  { label: isGreek ? 'Μηνιαία' : 'Monthly', values: ['€29', '€49', '€99'] },
                  { label: isGreek ? 'Ετήσια' : 'Yearly', values: ['€290', '€490', '€990'] },
                  { label: isGreek ? 'Δωμάτια' : 'Rooms', values: [isGreek ? 'Έως 3' : 'Up to 3', isGreek ? 'Απεριόριστα' : 'Unlimited', isGreek ? 'Απεριόριστα' : 'Unlimited'] },
                  { label: 'Analytics', values: ['Basic', isGreek ? 'Προχωρημένα' : 'Advanced', isGreek ? 'Προχωρημένα + Revenue' : 'Advanced + Revenue'] },
                  { label: 'Support', values: ['Email', 'Priority', '24/7 + Manager'] },
                  { label: isGreek ? 'Συνδρομές' : 'Subscriptions', values: ['—', '✓', '✓'] },
                  { label: 'Custom Branding', values: ['—', '—', '✓'] },
                  { label: 'API Access', values: ['—', '—', '✓'] },
                  { label: 'White-label Widget', values: ['—', '—', '✓'] },
                  { label: 'Multi-location', values: ['—', '—', '✓'] },
                ].map(({ label, values }) => (
                  <tr key={label} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-brand-text-secondary">{label}</td>
                    {values.map((v, i) => (
                      <td key={i} className="text-center py-2.5 px-3 text-white">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
            <p className="text-emerald-400 font-semibold text-sm">
              {isGreek ? '🎉 Ετήσια Συνδρομή = 2 μήνες δωρεάν! (~17% έκπτωση)' : '🎉 Yearly Subscription = 2 months free! (~17% savings)'}
            </p>
          </div>

          <p>
            {isGreek
              ? 'Οι πληρωμές γίνονται ασφαλώς μέσω Stripe. Μπορείτε να διαχειριστείτε ή να ακυρώσετε τη συνδρομή σας ανά πάσα στιγμή μέσω της σελίδας Χρεώσεων.'
              : 'Payments are securely processed by Stripe. You can manage or cancel your subscription at any time from the Billing page.'}
          </p>
        </Section>

        {/* ─── 12. Onboarding ─── */}
        <Section icon={Layers} title={isGreek ? 'Διαδικασία Ένταξης' : 'Onboarding Process'}>
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm flex-shrink-0">1</div>
              <div>
                <p className="text-white font-medium">{isGreek ? 'Αποδοχή Όρων' : 'Accept Terms'}</p>
                <p className="text-xs mt-1">{isGreek ? 'Αποδοχή των όρων χρήσης και της πολιτικής απορρήτου' : 'Accept terms of service and privacy policy'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm flex-shrink-0">2</div>
              <div>
                <p className="text-white font-medium">{isGreek ? 'Επιλογή Πλάνου' : 'Choose Plan'}</p>
                <p className="text-xs mt-1">{isGreek ? 'Επιλέξτε πλάνο και ολοκληρώστε την πληρωμή μέσω Stripe Checkout' : 'Select a plan and complete payment via Stripe Checkout'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-bold text-sm flex-shrink-0">3</div>
              <div>
                <p className="text-white font-medium">{isGreek ? 'Αξιολόγηση Διαχειριστή' : 'Admin Review'}</p>
                <p className="text-xs mt-1">{isGreek ? 'Η αίτησή σας αξιολογείται εντός 48 ωρών' : 'Your application is reviewed within 48 hours'}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ─── 13. Friends & Invitations ─── */}
        <Section icon={Users} title={isGreek ? 'Φίλοι & Προσκλήσεις' : 'Friends & Invitations'}>
          <p>
            {isGreek
              ? 'Οι παίκτες μπορούν να στείλουν αιτήματα φιλίας και να προσκαλέσουν φίλους σε κρατήσεις.'
              : 'Players can send friend requests and invite friends to their bookings.'}
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <div className="flex gap-3 items-center">
              <Users className="w-4 h-4 text-brand-red" />
              <span>{isGreek ? 'Σύστημα αιτημάτων φιλίας (αποστολή/αποδοχή/απόρριψη)' : 'Friend request system (send/accept/reject)'}</span>
            </div>
            <div className="flex gap-3 items-center">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isGreek ? 'Πρόσκληση φίλων σε κράτηση μέσω ειδοποίησης' : 'Invite friends to a booking via notification'}</span>
            </div>
            <div className="flex gap-3 items-center">
              <Bell className="w-4 h-4 text-blue-400" />
              <span>{isGreek ? 'Ειδοποιήσεις σε κάθε βήμα (αίτημα, αποδοχή, πρόσκληση)' : 'Notifications at every step (request, accepted, invite)'}</span>
            </div>
          </div>
        </Section>

        {/* ─── Help ─── */}
        <div className="mt-8 bg-brand-surface rounded-2xl border border-white/5 p-6 text-center">
          <p className="text-brand-text-secondary text-sm">
            {isGreek
              ? 'Χρειάζεστε βοήθεια; Επικοινωνήστε μαζί μας στο'
              : 'Need help? Contact us at'}{' '}
            <a href="mailto:hello@unlocked.gr" className="text-brand-red hover:underline">
              hello@unlocked.gr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
