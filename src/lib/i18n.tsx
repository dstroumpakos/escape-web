/**
 * Internationalization for UNLOCKED web app.
 * Mirrors the i18n system from the mobile app with EN/EL support.
 */

'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type Language = 'en' | 'el';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.leaderboard': 'Leaderboard',
    'nav.contact': 'Contact',
    'nav.login': 'Log In',
    'nav.signup': 'Sign Up',

    // Home
    'home.badge': 'The #1 Escape Room Platform',
    'home.title1': 'Discover. Escape.',
    'home.title2': 'Get UNLOCKED.',
    'home.subtitle': 'Find and book the best escape rooms near you. Challenge your team, solve puzzles, and create memories that last a lifetime.',
    'home.search_placeholder': 'Search escape rooms, themes, or locations...',
    'home.get_started': 'Get Started Free',
    'home.learn_more': 'Learn More',
    'home.featured_title': 'Featured Escape Rooms',
    'home.featured_subtitle': 'Handpicked rooms with the highest ratings and most thrilling experiences.',
    'home.themes_title': 'Choose Your Theme',
    'home.how_title': 'How It Works',

    // Auth
    'auth.welcome_back': 'Welcome Back',
    'auth.login_subtitle': 'Log in to continue your escape journey',
    'auth.create_account': 'Create Account',
    'auth.signup_subtitle': 'Join the community and start your escape journey',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.full_name': 'Full Name',
    'auth.remember_me': 'Remember me',
    'auth.forgot_password': 'Forgot password?',
    'auth.no_account': "Don't have an account?",
    'auth.has_account': 'Already have an account?',
    'auth.signup_free': 'Sign up free',

    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.subtitle': "See who's dominating the escape room scene.",
    'leaderboard.top_players': 'Top Players',
    'leaderboard.top_rooms': 'Top Rooms',
    'leaderboard.badges': 'Badges',

    // Contact
    'contact.title': 'Get in Touch',
    'contact.subtitle': 'Have a question, want to partner with us, or just want to say hello?',
    'contact.send': 'Send Message',
    'contact.sent': 'Message Sent!',
    'contact.sent_desc': "Thank you for reaching out. We'll get back to you within 24 hours.",

    // Common
    'common.per_person': '/person',
    'common.reviews': 'reviews',
    'common.difficulty': 'Difficulty',
    'common.view_all': 'View All',
    'common.loading': 'Loading...',
  },
  el: {
    // Navigation
    'nav.home': 'Αρχική',
    'nav.about': 'Σχετικά',
    'nav.leaderboard': 'Κατάταξη',
    'nav.contact': 'Επικοινωνία',
    'nav.login': 'Σύνδεση',
    'nav.signup': 'Εγγραφή',

    // Home
    'home.badge': 'Η #1 Πλατφόρμα Escape Room',
    'home.title1': 'Ανακάλυψε. Δραπέτευσε.',
    'home.title2': 'UNLOCKED.',
    'home.subtitle': 'Βρες και κλείσε τα καλύτερα escape rooms κοντά σου. Προκάλεσε την ομάδα σου.',
    'home.search_placeholder': 'Αναζήτηση escape rooms, θεμάτων ή τοποθεσιών...',
    'home.get_started': 'Ξεκίνα Δωρεάν',
    'home.learn_more': 'Μάθε Περισσότερα',
    'home.featured_title': 'Προτεινόμενα Escape Rooms',
    'home.featured_subtitle': 'Επιλεγμένα δωμάτια με τις υψηλότερες βαθμολογίες.',
    'home.themes_title': 'Διάλεξε Θέμα',
    'home.how_title': 'Πώς Λειτουργεί',

    // Auth
    'auth.welcome_back': 'Καλώς Ήρθες Πίσω',
    'auth.login_subtitle': 'Συνδέσου για να συνεχίσεις την περιπέτειά σου',
    'auth.create_account': 'Δημιουργία Λογαριασμού',
    'auth.signup_subtitle': 'Γίνε μέλος της κοινότητας',
    'auth.email': 'Email',
    'auth.password': 'Κωδικός',
    'auth.confirm_password': 'Επιβεβαίωση Κωδικού',
    'auth.full_name': 'Ονοματεπώνυμο',
    'auth.remember_me': 'Θυμήσου με',
    'auth.forgot_password': 'Ξέχασες τον κωδικό;',
    'auth.no_account': 'Δεν έχεις λογαριασμό;',
    'auth.has_account': 'Έχεις ήδη λογαριασμό;',
    'auth.signup_free': 'Εγγραφή δωρεάν',

    // Leaderboard
    'leaderboard.title': 'Κατάταξη',
    'leaderboard.subtitle': 'Δες ποιος κυριαρχεί στα escape rooms.',
    'leaderboard.top_players': 'Κορυφαίοι Παίκτες',
    'leaderboard.top_rooms': 'Κορυφαία Δωμάτια',
    'leaderboard.badges': 'Σήματα',

    // Contact
    'contact.title': 'Επικοινωνία',
    'contact.subtitle': 'Έχεις ερώτηση ή θέλεις να συνεργαστείς μαζί μας;',
    'contact.send': 'Αποστολή',
    'contact.sent': 'Το μήνυμα στάλθηκε!',
    'contact.sent_desc': 'Ευχαριστούμε. Θα σας απαντήσουμε εντός 24 ωρών.',

    // Common
    'common.per_person': '/άτομο',
    'common.reviews': 'κριτικές',
    'common.difficulty': 'Δυσκολία',
    'common.view_all': 'Δες Όλα',
    'common.loading': 'Φόρτωση...',
  },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      let text =
        translations[language]?.[key] ??
        translations.en?.[key] ??
        key;

      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, v);
        });
      }

      return text;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
