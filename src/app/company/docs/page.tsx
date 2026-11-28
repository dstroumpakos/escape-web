'use client';

import { useTranslation } from '@/lib/i18n';
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  Clock,
  CreditCard,
  Wallet,
  Star,
  Camera,
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
  BadgeCheck,
  Sparkles,
  Rocket,
  DoorOpen,
  ExternalLink,
  Stamp,
  ShoppingBag,
  MousePointerClick,
} from 'lucide-react';
import { useState } from 'react';
import { BOOKING_ENABLED, PASSPORT_ENABLED, PREMIUM_ENABLED } from '@/lib/features';

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
        <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-red-light" />
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

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 space-y-2">
      {title && (
        <p className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{title}</p>
      )}
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2">
      <span className="text-brand-text-secondary/60 sm:min-w-[140px]">{label}:</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function Badge({ children, color = 'red' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    red: 'bg-brand-red/10 text-brand-red-light',
    green: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    gray: 'bg-white/10 text-brand-text-secondary',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${colors[color]}`}>
      {children}
    </span>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red-light font-bold text-sm shrink-0">
        {n}
      </div>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-xs mt-1">{desc}</p>
      </div>
    </div>
  );
}

/**
 * The guide while UNLOCKED's own booking is off (src/lib/features.ts): rooms
 * are adverts, players book on the company's own site, the company gives out
 * sells merch. Listing is free: no plans, slots, widget or room payments.
 */
function AdvertGuide({ g }: { g: (el: string, en: string) => string }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-brand-red-light" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">{g('Οδηγός Πλατφόρμας', 'Platform Guide')}</h1>
            <p className="text-brand-text-secondary text-sm">
              {g(
                'Όλα όσα χρειάζεστε για να φέρνετε παίκτες στο escape room σας με το UNLOCKED',
                'Everything you need to bring players to your escape room with UNLOCKED'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Getting started */}
        <Section icon={Rocket} title={g('Ξεκινώντας', 'Getting Started')} defaultOpen>
          <Card>
            <div className="space-y-4">
              <Step n={1} title={g('Αποδοχή όρων', 'Accept the terms')} desc={g('Αποδεχτείτε τους όρους χρήσης και την πολιτική απορρήτου.', 'Accept the terms of service and the privacy policy.')} />
              <Step n={2} title={g('Επιβεβαίωση', 'Confirm')} desc={g('Πατήστε «Συνέχεια». Η καταχώρηση των δωματίων σας είναι δωρεάν.', 'Tap "Continue". Listing your rooms is free.')} />
              <Step n={3} title={g('Έλεγχος στοιχείων', 'Account review')} desc={g('Ελέγχουμε τα στοιχεία σας, συνήθως μέσα σε 1 με 2 εργάσιμες. Θα λάβετε email μόλις εγκριθεί ο λογαριασμός σας.', 'We check your details, usually within 1 to 2 working days. You get an email as soon as your account is approved.')} />
              <Step n={4} title={g('Λίστα εκκίνησης', 'Getting-started checklist')} desc={g('Μόλις συνδεθείτε, μια σύντομη λίστα στον πίνακα ελέγχου σας οδηγεί: προφίλ εταιρείας, πρώτο δωμάτιο και φωτογραφία δωματίου.', 'Once you sign in, a short checklist on your dashboard walks you through it: company profile, first room and a room photo.')} />
            </div>
          </Card>
        </Section>

        {/* 2. Rooms and the booking link */}
        <Section icon={DoorOpen} title={g('Δωμάτια & Κράτηση στο Site σας', 'Rooms & Booking on Your Site')}>
          <p>
            {g(
              'Κάθε δωμάτιο έχει δική του σελίδα στο UNLOCKED με φωτογραφίες, περιγραφή, θέμα, δυσκολία, διάρκεια και αριθμό παικτών. Το UNLOCKED δεν κάνει κρατήσεις και δεν παίρνει πληρωμές για τα δωμάτια.',
              'Every room has its own page on UNLOCKED with photos, description, theme, difficulty, duration and number of players. UNLOCKED takes no bookings or payments for rooms.'
            )}
          </p>
          <Card title={g('Πού πάει ο παίκτης', 'Where players go')}>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <ExternalLink className="w-4 h-4 text-brand-red-light shrink-0 mt-0.5" />
                <span>{g('Ο παίκτης πατά «Κλείσε στο Site τους» και πηγαίνει στο «Link κράτησης» του δωματίου (στην επεξεργασία δωματίου) ή, αν είναι κενό, στο website σας από τις Ρυθμίσεις.', 'Players tap "Book on Their Site" and go to the room\'s "Booking link" (in the room editor) or, if it is empty, to your website from Settings.')}</span>
              </div>
              <div className="flex gap-3 items-start">
                <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{g('Χωρίς κανέναν σύνδεσμο, εμφανίζεται το τηλέφωνο της εταιρείας σας.', 'With no link at all, your company phone number is shown.')}</span>
              </div>
              <div className="flex gap-3 items-start">
                <MousePointerClick className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{g('Στον πίνακα ελέγχου βλέπετε πόσοι παίκτες πάτησαν το κουμπί τις τελευταίες 30 ημέρες, ανά δωμάτιο.', 'On your dashboard you see how many players tapped the button in the last 30 days, per room.')}</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* 3. QR stamps (hidden while the passport is off) */}
        {PASSPORT_ENABLED && (
        <Section icon={Stamp} title={g('Σφραγίδες QR', 'QR Stamps')}>
          <p>
            {g(
              'Στο τέλος κάθε παιχνιδιού δίνετε στην ομάδα τη σφραγίδα του δωματίου σας για το UNLOCKED διαβατήριό τους.',
              'At the end of every game you give the team your room\'s stamp for their UNLOCKED passport.'
            )}
          </p>
          <Card title={g('Βήματα', 'Steps')}>
            <div className="space-y-4">
              <Step n={1} title={g('Σφραγίδες QR', 'QR Stamps')} desc={g('Ανοίξτε «Σφραγίδες QR» από το μενού (ή από την εφαρμογή).', 'Open "QR Stamps" from the menu (or from the app).')} />
              <Step n={2} title={g('Στοιχεία παιχνιδιού', 'Game details')} desc={g('Διαλέξτε δωμάτιο, ώρα έναρξης της ομάδας, αριθμό παικτών και αν απέδρασαν (με τον χρόνο τους, αν θέλετε).', 'Pick the room, the team\'s start time, the number of players and whether they escaped (with their time, if you like).')} />
              <Step n={3} title={g('Δείξτε το QR', 'Show the QR')} desc={g('Κάθε παίκτης το σκανάρει με το κινητό του και παίρνει τη σφραγίδα. Βλέπετε ζωντανά πόσοι την πήραν.', 'Each player scans it with their phone and gets the stamp. You see live how many took it.')} />
            </div>
          </Card>
          <Card>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Το QR ισχύει 30 λεπτά και δίνει τόσες σφραγίδες όσοι οι παίκτες.', 'The QR is valid for 30 minutes and gives as many stamps as there are players.')}</li>
              <li>{g('Κάθε παίκτης παίρνει μία σφραγίδα ανά δωμάτιο.', 'Each player gets one stamp per room.')}</li>
              <li>{g('Οι σφραγίδες ανοίγουν ορόφους και δώρα στο παιχνίδι του Στοιχειωμένου Πύργου, οπότε οι παίκτες θέλουν να έρθουν ξανά.', 'Stamps open floors and gifts in the Haunted Tower game, so players want to come back.')}</li>
            </ul>
          </Card>
        </Section>

        )}

        {/* 4. Merch */}
        <Section icon={ShoppingBag} title={g('Merch', 'Merch')}>
          <p>
            {g(
              'Από το «Merch» ανεβάζετε προϊόντα των δωματίων σας (μπλουζάκια, κούπες, αναμνηστικά) στο κατάστημα του UNLOCKED. Εσείς είστε ο πωλητής.',
              'From "Merch" you add products of your rooms (t-shirts, mugs, souvenirs) to the UNLOCKED shop. You are the seller.'
            )}
          </p>
          <Card>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Για online πληρωμές συνδέστε τον λογαριασμό Stripe ή Viva σας από τις «Πληρωμές». Τα χρήματα πηγαίνουν απευθείας σε εσάς.', 'For online payments connect your Stripe or Viva account from "Payments". The money goes straight to you.')}</li>
              <li>{g('Χωρίς συνδεδεμένο λογαριασμό, οι παίκτες πληρώνουν στην παραλαβή.', 'Without a connected account, players pay at pickup.')}</li>
              <li>{g('Εσείς αναλαμβάνετε παραλαβή ή αποστολή, επιστροφές και επιστροφές χρημάτων.', 'You handle pickup or shipping, returns and refunds.')}</li>
            </ul>
          </Card>
        </Section>

        {/* 5. Photos */}
        <Section icon={Camera} title={g('Φωτογραφίες Ομάδων', 'Team Photos')}>
          <p>
            {g(
              'Η εφαρμογή Photos (από το μενού του portal, με τον ίδιο λογαριασμό) σας επιτρέπει να ανεβάζετε φωτογραφίες ομάδων, να βάζετε το branding σας και να τις στέλνετε στους παίκτες με email. Κάθε φωτογραφία έχει δική της σελίδα με link, και βλέπετε προβολές και λήψεις.',
              'The Photos app (from the portal menu, with the same account) lets you upload team photos, add your branding and email them to the players. Every photo gets its own page link, and you can see views and downloads.'
            )}
          </p>
        </Section>

        {/* 6. Early Access (Premium players only) */}
        {PREMIUM_ENABLED && (
        <Section icon={Sparkles} title={g('Πρόγραμμα Early Access', 'Early Access Partner Program')}>
          <p>{g('Ενταχθείτε από τις Ρυθμίσεις → Early Access. Ως Early Access Partner:', 'Join from Settings → Early Access. As an Early Access Partner:')}</p>
          <Card>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Τα δωμάτιά σας εμφανίζονται στο Featured Spotlight της αρχικής σελίδας', 'Your rooms appear in the Featured Spotlight on the home page')}</li>
              <li>{g('Ορίζετε ημερομηνία κυκλοφορίας και οι Premium παίκτες βλέπουν το δωμάτιο έως 3 ημέρες νωρίτερα', 'You set a release date and Premium players see the room up to 3 days early')}</li>
              <li>{g('Οι Premium παίκτες ειδοποιούνται όταν προσθέτετε νέο δωμάτιο', 'Premium players are notified when you add a new room')}</li>
              <li>{g('Τα δωμάτιά σας έχουν το σήμα "Early Access"', 'Your rooms show the "Early Access" badge')}</li>
            </ul>
          </Card>
        </Section>
        )}

        <div className="mt-8 bg-brand-surface rounded-2xl border border-white/5 p-6 text-center">
          <p className="text-brand-text-secondary text-sm">
            {g('Χρειάζεστε βοήθεια; Στείλτε μας email στο', 'Need help? Email us at')}{' '}
            <a href="mailto:hello@unlocked.gr" className="text-brand-red-light hover:underline">hello@unlocked.gr</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const { language } = useTranslation();
  const isGreek = language === 'el';
  const g = (el: string, en: string) => (isGreek ? el : en);

  if (!BOOKING_ENABLED) return <AdvertGuide g={g} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-red/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-brand-red-light" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {g('Οδηγός Πλατφόρμας', 'Platform Guide')}
            </h1>
            <p className="text-brand-text-secondary text-sm">
              {g(
                'Όλα όσα χρειάζεστε για να δέχεστε κρατήσεις με το UNLOCKED',
                'Everything you need to take bookings with UNLOCKED'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* ─── 1. Getting started ─── */}
        <Section icon={Rocket} title={g('Ξεκινώντας', 'Getting Started')} defaultOpen>
          <Card>
            <div className="space-y-4">
              <Step
                n={1}
                title={g('Αποδοχή όρων', 'Accept the terms')}
                desc={g(
                  'Αποδεχτείτε τους όρους χρήσης και την πολιτική απορρήτου.',
                  'Accept the terms of service and the privacy policy.'
                )}
              />
              <Step
                n={2}
                title={g('Επιλογή πλάνου', 'Choose a plan')}
                desc={g(
                  'Ξεκινήστε με Pay as you go χωρίς να πληρώσετε τίποτα τώρα, ή επιλέξτε Απεριόριστο και πληρώστε μέσω Stripe.',
                  'Start on pay as you go without paying anything now, or pick Unlimited and pay through Stripe.'
                )}
              />
              <Step
                n={3}
                title={g('Έλεγχος στοιχείων', 'Account review')}
                desc={g(
                  'Ελέγχουμε τα στοιχεία σας, συνήθως μέσα σε 1 με 2 εργάσιμες. Θα λάβετε email μόλις εγκριθεί ο λογαριασμός σας.',
                  'We check your details, usually within 1 to 2 working days. You get an email as soon as your account is approved.'
                )}
              />
              <Step
                n={4}
                title={g('Λίστα εκκίνησης', 'Getting-started checklist')}
                desc={g(
                  'Μόλις συνδεθείτε, μια σύντομη λίστα στον πίνακα ελέγχου σας οδηγεί: προφίλ εταιρείας, πρώτο δωμάτιο, φωτογραφία δωματίου, εβδομαδιαίες ώρες και widget στην ιστοσελίδα σας.',
                  'Once you sign in, a short checklist on your dashboard walks you through it: company profile, first room, a room photo, weekly times and the widget on your website.'
                )}
              />
            </div>
          </Card>
        </Section>

        {/* ─── 2. Plans & Pricing ─── */}
        <Section icon={CreditCard} title={g('Πλάνα & Τιμολόγηση', 'Plans & Pricing')}>
          <p>
            {g(
              'Υπάρχουν δύο πλάνα. Και τα δύο περιλαμβάνουν όλες τις λειτουργίες και απεριόριστα δωμάτια. Διαφέρουν μόνο στον τρόπο που πληρώνετε.',
              'There are two plans. Both include every feature and unlimited rooms. They only differ in how you pay.'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <Badge color="green">Pay as you go</Badge>
              <p className="text-white text-xl font-bold">
                €3 <span className="text-sm font-normal text-brand-text-secondary">/ {g('κράτηση', 'booking')}</span>
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-xs">
                <li>{g('Χωρίς μηνιαία συνδρομή', 'No monthly fee')}</li>
                <li>{g('Ποτέ πάνω από €250 τον μήνα', 'Never more than €250 a month')}</li>
                <li>{g('Τιμολόγιο με email την 1η κάθε μήνα για τον προηγούμενο', 'Invoiced by email on the 1st for the previous month')}</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <Badge color="purple">{g('Απεριόριστο', 'Unlimited')}</Badge>
              <p className="text-white text-xl font-bold">
                €198 <span className="text-sm font-normal text-brand-text-secondary">/ {g('μήνα', 'month')}</span>
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-xs">
                <li>{g('Χωρίς χρεώσεις ανά κράτηση', 'No per-booking fees')}</li>
                <li>{g('Ετήσια: €1980 (2 μήνες δωρεάν)', 'Yearly: €1980 (2 months free)')}</li>
                <li>{g('Συμφέρει από 66 κρατήσεις τον μήνα', 'Worth it from 66 bookings a month')}</li>
              </ul>
            </div>
          </div>

          <Card title={g('Ποιες κρατήσεις χρεώνονται', 'Which bookings count')}>
            <p>
              {g(
                'Στο Pay as you go μετράνε οι κρατήσεις που κάνουν παίκτες στην εφαρμογή, στην ιστοσελίδα UNLOCKED ή στο widget της ιστοσελίδας σας. Ακυρωμένες κρατήσεις και κρατήσεις που περιμένουν πληρωμή δεν μετράνε. Όσες προσθέτετε εσείς (τηλέφωνο, walk-in, ιδιωτικές εκδηλώσεις, άλλες πλατφόρμες) είναι δωρεάν.',
                'On pay as you go, bookings players make in the app, on the UNLOCKED website or through your website widget count. Cancelled bookings and bookings still waiting for payment don\'t. Bookings you add yourself (phone, walk-in, private events, other platforms) are free.'
              )}
            </p>
          </Card>

          <Card title={g('Αλλαγή πλάνου', 'Changing plan')}>
            <p>
              {g(
                'Στη σελίδα Χρεώσεων βλέπετε πόσες κρατήσεις έχετε αυτόν τον μήνα και τα τιμολόγιά σας. Από εκεί μπορείτε να περάσετε στο Απεριόριστο. Για να επιστρέψετε στο Pay as you go, ακυρώστε τη συνδρομή στο Stripe: η αλλαγή γίνεται όταν λήξει η περίοδος που έχετε πληρώσει.',
                'The Billing page shows this month\'s bookings so far and your invoices. You can switch to Unlimited from there. To go back to pay as you go, cancel the subscription in Stripe: you switch when the paid period ends.'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 3. Booking System ─── */}
        <Section icon={CalendarDays} title={g('Σύστημα Κρατήσεων', 'Booking System')}>
          <p>
            {g(
              'Οι παίκτες επιλέγουν δωμάτιο, ημερομηνία, ώρα και αριθμό παικτών. Κάθε κράτηση παίρνει έναν μοναδικό κωδικό, που ο παίκτης βλέπει στην επιβεβαίωση και στα εισιτήριά του. Ο ίδιος κωδικός εμφανίζεται στη σελίδα Κρατήσεις, ώστε να τον συγκρίνετε στην είσοδο.',
              'Players pick a room, date, time and number of players. Every booking gets a unique code, which the player sees on the confirmation and in their tickets. The same code is shown on your Bookings page, so you can match it at the door.'
            )}
          </p>

          <Card title={g('Κωδικοί κράτησης', 'Booking codes')}>
            <InfoRow label={g('Εφαρμογή & ιστοσελίδα', 'App & website')} value="UNL-XXXXXXXX" />
            <InfoRow label="Widget" value="WEB-XXXXXXXX" />
          </Card>

          <Card title={g('Καταστάσεις κράτησης', 'Booking statuses')}>
            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{g('Προσεχής', 'Upcoming')}</Badge>
              <Badge color="green">{g('Ολοκληρωμένη', 'Completed')}</Badge>
              <Badge color="red">{g('Ακυρωμένη', 'Cancelled')}</Badge>
              <Badge color="amber">{g('Αναμονή πληρωμής', 'Awaiting payment')}</Badge>
            </div>
          </Card>

          <Card title={g('Επιλογές πληρωμής ανά δωμάτιο', 'Payment options per room')}>
            <p>
              {g(
                'Στις ρυθμίσεις κάθε δωματίου επιλέγετε ποιες επιλογές βλέπουν οι παίκτες. Μπορείτε να ενεργοποιήσετε μία ή περισσότερες:',
                'In each room\'s settings you choose which options players see. You can turn on one or more:'
              )}
            </p>
            <div className="space-y-3 mt-2">
              <div className="flex gap-3">
                <Badge color="green">{g('Πλήρης', 'Full')}</Badge>
                <span>{g('Ο παίκτης πληρώνει όλο το ποσό online.', 'The player pays the whole amount online.')}</span>
              </div>
              <div className="flex gap-3">
                <Badge color="amber">{g('Προκαταβολή', 'Deposit')}</Badge>
                <span>
                  {g(
                    'Ο παίκτης πληρώνει ένα ποσοστό online (προεπιλογή 20%) και το υπόλοιπο στον χώρο.',
                    'The player pays a share online (20% by default) and the rest at the venue.'
                  )}
                </span>
              </div>
              <div className="flex gap-3">
                <Badge color="blue">{g('Στον χώρο', 'At the venue')}</Badge>
                <span>{g('Καμία online πληρωμή. Η κράτηση επιβεβαιώνεται αμέσως.', 'No online payment. The booking is confirmed right away.')}</span>
              </div>
            </div>
            <p className="mt-2">
              {g(
                'Οι online επιλογές εμφανίζονται μόνο αφού συνδέσετε λογαριασμό Stripe ή Viva (δείτε Online Πληρωμές).',
                'The online options only appear once you connect a Stripe or Viva account (see Online Payments).'
              )}
            </p>
          </Card>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex items-start gap-3">
            <Timer className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold text-sm">
                {g('Μη πληρωμένες κρατήσεις λήγουν σε 30 λεπτά', 'Unpaid bookings expire after 30 minutes')}
              </p>
              <p className="mt-1">
                {g(
                  'Η ώρα κρατιέται για τον παίκτη όσο πληρώνει. Αν δεν ολοκληρώσει την πληρωμή μέσα σε 30 λεπτά, η κράτηση ακυρώνεται και η ώρα ανοίγει ξανά.',
                  'The time is held for the player while they pay. If they don\'t finish paying within 30 minutes, the booking is cancelled and the time opens again.'
                )}
              </p>
            </div>
          </div>

          <Card title={g('Χωρίς διπλές κρατήσεις', 'No double bookings')}>
            <p>
              {g(
                'Πριν από κάθε κράτηση, το σύστημα ελέγχει αν υπάρχει ήδη ενεργή κράτηση στο ίδιο δωμάτιο, ημερομηνία και ώρα. Αν υπάρχει, η νέα κράτηση απορρίπτεται.',
                'Before every booking, the system checks for an active booking at the same room, date and time. If there is one, the new booking is rejected.'
              )}
            </p>
          </Card>

          <Card title={g('Email επιβεβαίωσης', 'Confirmation emails')}>
            <p>
              {g(
                'Μόλις δημιουργηθεί η κράτηση (ή επιβεβαιωθεί η πληρωμή), στέλνεται αυτόματα email επιβεβαίωσης στον παίκτη και σε εσάς.',
                'As soon as a booking is made (or its payment is confirmed), a confirmation email goes to the player and to you automatically.'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 4. Online Payments ─── */}
        <Section icon={Wallet} title={g('Online Πληρωμές', 'Online Payments')}>
          <p>
            {g(
              'Οι παίκτες πληρώνουν απευθείας στον δικό σας λογαριασμό Stripe ή Viva. Το UNLOCKED δεν κρατάει ποτέ τα χρήματα. Η σύνδεση γίνεται από τη σελίδα Πληρωμές.',
              'Players pay straight into your own Stripe or Viva account. UNLOCKED never holds the money. You connect your account on the Payments page.'
            )}
          </p>

          <Card title={g('Σύνδεση λογαριασμού', 'Connecting an account')}>
            <InfoRow label="Stripe" value={g('Επικολλήστε το Secret key από Developers → API keys', 'Paste your Secret key from Developers → API keys')} />
            <InfoRow
              label="Viva"
              value={g(
                'Merchant ID, API Key, Smart Checkout credentials και τον κωδικό πηγής πληρωμής',
                'Merchant ID, API Key, Smart Checkout credentials and the payment source code'
              )}
            />
            <p className="pt-2">
              {g(
                'Ελέγχουμε τα κλειδιά με τον πάροχο πριν τα αποθηκεύσουμε, τα κρατάμε κρυπτογραφημένα και δεν τα εμφανίζουμε ξανά. Για κάθε αλλαγή στα στοιχεία πληρωμής ζητάμε τον κωδικό σας, ώστε κανείς άλλος να μη μπορεί να ανακατευθύνει τα χρήματά σας.',
                'We check the keys with the provider before saving them, store them encrypted and never show them again. Every change to payment details asks for your password, so nobody else can redirect your money.'
              )}
            </p>
          </Card>

          <Card title={g('Δοκιμαστική λειτουργία', 'Test mode')}>
            <p>
              {g(
                'Με κλειδιά δοκιμής (sk_test_ ή λογαριασμό Viva Demo) οι παίκτες βλέπουν δοκιμαστική σελίδα πληρωμής και δεν χρεώνονται πραγματικά χρήματα. Συνδέστε τα live κλειδιά όταν είστε έτοιμοι.',
                'With test keys (sk_test_ or a Viva demo account) players see a test checkout and no real money is charged. Connect your live keys when you\'re ready.'
              )}
            </p>
          </Card>

          <Card title={g('Προκαταβολή & χρέωση κράτησης', 'Deposit & booking fee')}>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                {g(
                  'Ορίστε το προεπιλεγμένο ποσοστό προκαταβολής (1 έως 99%) και, αν θέλετε, διαφορετικό ποσοστό ανά δωμάτιο.',
                  'Set your default deposit (1 to 99%) and, if you like, a different % per room.'
                )}
              </li>
              <li>
                {g(
                  'Προαιρετικά προσθέστε χρέωση κράτησης έως €20 στις online πληρωμές. Ο παίκτης τη βλέπει πριν πληρώσει και πηγαίνει σε εσάς μαζί με την κράτηση.',
                  'Optionally add a booking fee of up to €20 to online payments. The player sees it before paying and it goes to you with the booking.'
                )}
              </li>
            </ul>
          </Card>

          <Card title={g('Επιβεβαίωση & επιστροφές', 'Confirmation & refunds')}>
            <p>
              {g(
                'Η κράτηση επιβεβαιώνεται μόνο αφού ο πάροχος επιβεβαιώσει ότι η πληρωμή πέτυχε για το σωστό ποσό. Οι επιστροφές χρημάτων γίνονται από το dashboard του Stripe ή της Viva. Αν αποσυνδέσετε τον λογαριασμό, οι παίκτες πληρώνουν μόνο στον χώρο και όσες κρατήσεις έχουν ήδη πληρωθεί μένουν πληρωμένες.',
                'A booking is confirmed only after the provider confirms the payment succeeded for the right amount. Refunds are made from your Stripe or Viva dashboard. If you disconnect your account, players can only pay at the venue, and bookings already paid stay paid.'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 5. Bookings Calendar ─── */}
        <Section icon={CalendarRange} title={g('Ημερολόγιο Κρατήσεων', 'Bookings Calendar')}>
          <p>
            {g(
              'Η σελίδα Κρατήσεις δείχνει όλα τα δωμάτιά σας σε ημερολόγιο. Επιλέξτε προβολή Ημέρα, 2 ημέρες, 3 ημέρες, Εβδομάδα ή Λίστα.',
              'The Bookings page shows all your rooms on a calendar. Pick the Day, 2 days, 3 days, Week or List view.'
            )}
          </p>

          <Card title={g('Χρώματα', 'Colours')}>
            <div className="flex flex-wrap gap-2">
              <Badge color="green">{g('Ελεύθερη', 'Free')}</Badge>
              <Badge color="blue">{g('Κλεισμένη', 'Booked')}</Badge>
              <Badge color="purple">{g('Εξωτερική ή χειροκίνητη', 'External or manual')}</Badge>
              <Badge color="amber">{g('Αναμονή πληρωμής', 'Awaiting payment')}</Badge>
              <Badge color="red">{g('Κλειστή', 'Closed')}</Badge>
              <Badge color="gray">{g('Παρελθούσα', 'Past')}</Badge>
            </div>
          </Card>

          <Card title={g('Προσθήκη κράτησης', 'Adding a booking')}>
            <p>
              {g(
                'Πατήστε μια πράσινη ώρα για να προσθέσετε κράτηση με τα στοιχεία του πελάτη, ή μπλοκάρετε την ώρα ως εξωτερική κράτηση με πηγή Τηλέφωνο, Walk-in, Ιδιωτική εκδήλωση ή Άλλο. Οι κρατήσεις που προσθέτετε εσείς δεν χρεώνονται στο Pay as you go.',
                'Tap a green time to add a booking with the customer\'s details, or block it as an external booking with the source Phone, Walk-in, Private event or Other. Bookings you add yourself are never charged on pay as you go.'
              )}
            </p>
          </Card>

          <Card title={g('Λεπτομέρειες κράτησης', 'Booking details')}>
            <p>
              {g(
                'Πατήστε μια κράτηση για να δείτε τον κωδικό, τα στοιχεία επικοινωνίας και την κατάσταση πληρωμής, να προσθέσετε σημείωση, να την ολοκληρώσετε ή να την ακυρώσετε.',
                'Tap a booking to see its code, contact details and payment status, add a note, mark it completed or cancel it.'
              )}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge color="green">{g('Πληρώθηκε', 'Paid')}</Badge>
              <Badge color="amber">{g('Προκαταβολή', 'Deposit paid')}</Badge>
              <Badge color="blue">{g('Πληρωμή στον χώρο', 'Pay on arrival')}</Badge>
              <Badge color="gray">{g('Επιστροφή', 'Refunded')}</Badge>
            </div>
          </Card>
        </Section>

        {/* ─── 6. Time Slots & Availability ─── */}
        <Section icon={Clock} title={g('Ώρες & Διαθεσιμότητα', 'Time Slots & Availability')}>
          <Card title={g('Εβδομαδιαίο πρόγραμμα', 'Weekly schedule')}>
            <p>
              {g(
                'Για κάθε δωμάτιο ορίζετε τις ημέρες λειτουργίας και τις ώρες με την τιμή τους. Αυτό το πρόγραμμα ισχύει κάθε εβδομάδα. Τις ημέρες που το δωμάτιο δεν λειτουργεί, οι παίκτες το βλέπουν κλειστό.',
                'For each room you set its operating days and its times with their prices. This schedule repeats every week. On days the room doesn\'t operate, players see it as closed.'
              )}
            </p>
          </Card>

          <Card title={g('Άνοιγμα & κλείσιμο ωρών', 'Opening & closing times')}>
            <p>
              {g(
                'Στη σελίδα Slots επιλέγετε μέρα και πατάτε μια ώρα για να την ανοίξετε ή να την κλείσετε. Οι παίκτες βλέπουν την αλλαγή αμέσως. Μπορείτε επίσης να κλείσετε ή να ανοίξετε όλη τη μέρα, και να προσθέσετε έξτρα ώρα μόνο για μία μέρα.',
                'On the Slots page, pick a day and tap a time to open or close it. Players see the change right away. You can also close or open a whole day, and add an extra time for one day only.'
              )}
            </p>
          </Card>

          <Card title={g('Αργίες & πολλές ημέρες', 'Holidays & several days')}>
            <p>
              {g(
                'Με το "Κλείσιμο πολλών ημερών" κλείνετε ή ανοίγετε ξανά έως 92 ημέρες για όσα δωμάτια θέλετε (αργίες, συντήρηση, ιδιωτικές εκδηλώσεις). Οι υπάρχουσες κρατήσεις μένουν ως έχουν· κλείνουν μόνο οι ελεύθερες ώρες.',
                'With "Close several days" you close or reopen up to 92 days for the rooms you pick (holidays, maintenance, private events). Existing bookings stay as they are; only free times are closed.'
              )}
            </p>
          </Card>

          <Card title={g('Κανόνας τελευταίας ώρας', 'Last-hour rule')}>
            <p>
              {g(
                'Μια ελεύθερη ώρα κλείνει για κρατήσεις 1 ώρα πριν ξεκινήσει, εκτός αν η αμέσως προηγούμενη ώρα είναι κλεισμένη· τότε μένει ανοιχτή μέχρι να ξεκινήσει. Όσες ώρες έχουν ήδη ξεκινήσει κλείνουν αυτόματα.',
                'A free time closes for booking 1 hour before it starts, unless the time right before it is booked; then it stays open until it starts. Times that have already started close automatically.'
              )}
            </p>
          </Card>

          <Card title="Overflow slot">
            <p>
              {g(
                'Μια επιπλέον ώρα που εμφανίζεται μόνο όταν ΟΛΕΣ οι κανονικές ώρες είναι κλεισμένες. Ρυθμίζεται ανά δωμάτιο με ώρα, τιμή και τις ημέρες που ισχύει.',
                'A bonus time that only appears when ALL regular times are booked. Set per room with its time, price and the days it applies.'
              )}
            </p>
          </Card>

          <Card title={g('Τρόποι τιμολόγησης', 'Pricing modes')}>
            <div className="space-y-2 mt-1">
              <div className="flex gap-3">
                <Badge color="blue">{g('Ανά άτομο', 'Per person')}</Badge>
                <span>{g('Τιμή × αριθμός παικτών', 'Price × number of players')}</span>
              </div>
              <div className="flex gap-3">
                <Badge color="purple">{g('Ανά ομάδα', 'Per group')}</Badge>
                <span>
                  {g(
                    'Κλιμακωτή τιμή ανά μέγεθος ομάδας (π.χ. 2 άτομα = €50, 3 = €42, ...)',
                    'Tiered price per group size (e.g. 2 players = €50, 3 = €42, ...)'
                  )}
                </span>
              </div>
            </div>
          </Card>
        </Section>

        {/* ─── 7. Booking Widget ─── */}
        <Section icon={Code2} title={g('Widget Κρατήσεων', 'Booking Widget')}>
          <p>
            {g(
              'Βάλτε το widget κρατήσεων στη δική σας ιστοσελίδα. Οι πελάτες κλείνουν χωρίς λογαριασμό UNLOCKED.',
              'Put the booking widget on your own website. Customers book without an UNLOCKED account.'
            )}
          </p>

          <Card title={g('Χαρακτηριστικά', 'Features')}>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Διαθεσιμότητα σε πραγματικό χρόνο', 'Real-time availability')}</li>
              <li>{g('Κράτηση ως επισκέπτης, χωρίς λογαριασμό', 'Guest booking, no account needed')}</li>
              <li>{g('Online πληρωμή στον λογαριασμό σας Stripe ή Viva', 'Online payment into your Stripe or Viva account')}</li>
              <li>{g('Αυτόματα email επιβεβαίωσης', 'Automatic confirmation emails')}</li>
              <li>{g('Λειτουργεί σε κινητά', 'Works on mobile')}</li>
              <li>{g('Ειδοποιήσεις διαθεσιμότητας για επισκέπτες', 'Slot alerts for guests')}</li>
              <li>{g('Υποστηρίζει τιμή ανά ομάδα', 'Supports per-group pricing')}</li>
            </ul>
          </Card>

          <Card title={g('Ενσωμάτωση', 'Adding it to your site')}>
            <p>
              {g(
                'Στις Ρυθμίσεις → Widget αντιγράψτε τον κώδικα και επικολλήστε τον στο HTML της ιστοσελίδας σας, ή στείλτε τον με email στον developer σας με ένα κλικ. Το widget παίρνει αυτόματα το όνομα, το λογότυπο και τα δωμάτιά σας.',
                'In Settings → Widget, copy the code and paste it into your website\'s HTML, or email it to your web developer in one click. The widget picks up your name, logo and rooms automatically.'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 8. Slot Alerts ─── */}
        <Section icon={Bell} title={g('Ειδοποιήσεις Διαθεσιμότητας', 'Slot Alerts')}>
          <p>
            {g(
              'Οι παίκτες μπορούν να ζητήσουν ειδοποίηση για μια κλεισμένη ώρα. Αν η κράτηση ακυρωθεί, ειδοποιούνται αυτόματα ότι η ώρα είναι πάλι διαθέσιμη.',
              'Players can ask to be alerted about a booked time. If that booking is cancelled, they are told automatically that the time is free again.'
            )}
          </p>
          <Card>
            <p>
              {g(
                'Λειτουργεί για εγγεγραμμένους παίκτες (ειδοποίηση στην εφαρμογή) και για επισκέπτες του widget (email ή τηλέφωνο).',
                'Works for registered players (in-app notification) and for widget guests (email or phone).'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 9. Photos ─── */}
        <Section icon={Camera} title={g('Φωτογραφίες Ομάδων', 'Team Photos')}>
          <p>
            {g(
              'Η εφαρμογή Photos (από το μενού του portal, με τον ίδιο λογαριασμό) σας επιτρέπει να ανεβάζετε φωτογραφίες ομάδων, να βάζετε το branding σας και να τις στέλνετε στους παίκτες με email.',
              'The Photos app (from the portal menu, with the same account) lets you upload team photos, add your branding and email them to the players.'
            )}
          </p>

          <Card title={g('Branding ανά δωμάτιο', 'Branding per room')}>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Λογότυπο με μέγεθος και θέση (πάνω/κάτω, αριστερά/δεξιά, κάτω κέντρο)', 'Logo with size and position (top/bottom, left/right, bottom centre)')}</li>
              <li>{g('Overlay σε όλο το κάδρο (PNG με διαφάνεια) και αδιαφάνεια', 'Full-frame overlay (transparent PNG) and opacity')}</li>
              <li>{g('Χρώμα brand και προεπιλεγμένο φίλτρο', 'Brand colour and default filter')}</li>
              <li>
                {g(
                  'Κείμενο στη φωτογραφία με {{room}}, {{team}} και {{time}} που συμπληρώνονται αυτόματα',
                  'Text on the photo, with {{room}}, {{team}} and {{time}} filled in automatically'
                )}
              </li>
            </ul>
          </Card>

          <Card title={g('Ροή εργασίας', 'Workflow')}>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color="gray">{g('Πρόχειρη', 'Draft')}</Badge>
              <span className="text-brand-text-secondary/40">→</span>
              <Badge color="blue">{g('Έτοιμη', 'Ready')}</Badge>
              <span className="text-brand-text-secondary/40">→</span>
              <Badge color="green">{g('Στάλθηκε', 'Sent')}</Badge>
            </div>
            <p className="mt-2">
              {g(
                'Ανεβάστε τη φωτογραφία, γράψτε όνομα ομάδας, αποτέλεσμα και χρόνο, εφαρμόστε το branding και στείλτε τη στα email των παικτών. Κάθε φωτογραφία έχει δική της σελίδα με link, και βλέπετε προβολές και λήψεις.',
                'Upload the photo, add the team name, result and time, apply your branding and send it to the players\' emails. Every photo gets its own page link, and you can see views and downloads.'
              )}
            </p>
          </Card>
        </Section>

        {/* ─── 10. Reviews ─── */}
        <Section icon={Star} title={g('Αξιολογήσεις', 'Reviews')}>
          <p>
            {g(
              'Μόνο παίκτες με ολοκληρωμένη κράτηση μπορούν να αξιολογήσουν ένα δωμάτιο.',
              'Only players with a completed booking can review a room.'
            )}
          </p>
          <Card>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{g('Βαθμολογία 1 έως 5 αστέρια (υποχρεωτική)', 'Rating from 1 to 5 stars (required)')}</span>
              </div>
              <div className="flex gap-3 items-center">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{g('Κάθε αξιολόγηση είναι επιβεβαιωμένη, συνδεδεμένη με πραγματική κράτηση', 'Every review is verified and linked to a real booking')}</span>
              </div>
              <div className="flex gap-3 items-center">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{g('Μία αξιολόγηση ανά κράτηση', 'One review per booking')}</span>
              </div>
            </div>
          </Card>
          <p>
            {g(
              'Η μέση βαθμολογία και ο αριθμός αξιολογήσεων του δωματίου ενημερώνονται αυτόματα.',
              'The room\'s average rating and review count update automatically.'
            )}
          </p>
        </Section>

        {/* ─── 11. Early Access Partner Program ─── */}
        <Section icon={Sparkles} title={g('Πρόγραμμα Early Access', 'Early Access Partner Program')}>
          <p>
            {g(
              'Ενταχθείτε από τις Ρυθμίσεις → Early Access. Ως Early Access Partner:',
              'Join from Settings → Early Access. As an Early Access Partner:'
            )}
          </p>
          <Card>
            <ul className="space-y-2 list-disc pl-5">
              <li>{g('Τα δωμάτιά σας εμφανίζονται στο Featured Spotlight της αρχικής σελίδας', 'Your rooms appear in the Featured Spotlight on the home page')}</li>
              <li>{g('Ορίζετε ημερομηνία κυκλοφορίας και οι Premium παίκτες κλείνουν έως 3 ημέρες νωρίτερα', 'You set a release date and Premium players can book up to 3 days early')}</li>
              <li>{g('Οι Premium παίκτες ειδοποιούνται όταν προσθέτετε νέο δωμάτιο', 'Premium players are notified when you add a new room')}</li>
              <li>{g('Τα δωμάτιά σας έχουν το σήμα "Early Access"', 'Your rooms show the "Early Access" badge')}</li>
            </ul>
          </Card>
        </Section>

        {/* ─── 12. Leaderboard & Escape Rate ─── */}
        <Section icon={Trophy} title={g('Κατάταξη & Ποσοστό Απόδρασης', 'Leaderboard & Escape Rate')}>
          <Card title={g('Κατάταξη παικτών', 'Player ranking')}>
            <p>
              {g(
                'Οι παίκτες κατατάσσονται με βάση πόσα διαφορετικά δωμάτια έχουν λύσει. Σε ισοβαθμία, προηγείται όποιος χρειάστηκε λιγότερες προσπάθειες.',
                'Players are ranked by how many different rooms they escaped. On a tie, the player with fewer attempts goes first.'
              )}
            </p>
          </Card>
          <Card title={g('Ποσοστό απόδρασης δωματίου', 'Room escape rate')}>
            <p>
              {g(
                '(ολοκληρωμένες κρατήσεις / όλες οι παρελθούσες μη ακυρωμένες κρατήσεις) × 100%. Εμφανίζεται στην καρτέλα "Top Rooms".',
                '(completed bookings / all past non-cancelled bookings) × 100%. Shown on the "Top Rooms" tab.'
              )}
            </p>
          </Card>
          <Card title="Badges">
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
          </Card>
        </Section>

        {/* ─── 13. Notifications ─── */}
        <Section icon={Bell} title={g('Ειδοποιήσεις Παικτών', 'Player Notifications')}>
          <p>
            {g(
              'Οι ειδοποιήσεις στέλνονται στα Ελληνικά ή στα Αγγλικά, ανάλογα με τη γλώσσα του παίκτη.',
              'Notifications are sent in Greek or English, depending on the player\'s language.'
            )}
          </p>
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                g('Επιβεβαίωση κράτησης', 'Booking confirmation'),
                g('Ακύρωση κράτησης', 'Booking cancelled'),
                g('Υπενθύμιση κράτησης', 'Booking reminder'),
                g('Η ώρα είναι διαθέσιμη', 'Slot available'),
                g('Νέο δωμάτιο (Premium)', 'New room (Premium)'),
                g('Φωτογραφίες έτοιμες', 'Photos ready'),
                g('Αίτημα & αποδοχή φιλίας', 'Friend request & accepted'),
                g('Πρόσκληση σε κράτηση', 'Booking invite'),
                g('Προσφορές & ανακοινώσεις', 'Offers & announcements'),
              ].map((label) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red-light shrink-0" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ─── 14. Friends & Invitations ─── */}
        <Section icon={Users} title={g('Φίλοι & Προσκλήσεις', 'Friends & Invitations')}>
          <p>
            {g(
              'Οι παίκτες στέλνουν αιτήματα φιλίας και προσκαλούν φίλους στις κρατήσεις τους.',
              'Players send friend requests and invite friends to their bookings.'
            )}
          </p>
          <Card>
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <Users className="w-4 h-4 text-brand-red-light shrink-0" />
                <span>{g('Αιτήματα φιλίας (αποστολή, αποδοχή, απόρριψη)', 'Friend requests (send, accept, decline)')}</span>
              </div>
              <div className="flex gap-3 items-center">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{g('Πρόσκληση φίλων σε κράτηση', 'Invite friends to a booking')}</span>
              </div>
              <div className="flex gap-3 items-center">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{g('Ειδοποίηση σε κάθε βήμα', 'A notification at every step')}</span>
              </div>
            </div>
          </Card>
        </Section>

        {/* ─── Help ─── */}
        <div className="mt-8 bg-brand-surface rounded-2xl border border-white/5 p-6 text-center">
          <p className="text-brand-text-secondary text-sm">
            {g('Χρειάζεστε βοήθεια; Στείλτε μας email στο', 'Need help? Email us at')}{' '}
            <a href="mailto:hello@unlocked.gr" className="text-brand-red-light hover:underline">
              hello@unlocked.gr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
