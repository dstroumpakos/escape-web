'use client';

import { useTranslation } from '@/lib/i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold mb-4">{t('error.title')}</h2>
      <p className="text-brand-text-secondary mb-8 max-w-md text-center">
        {t('error.description')}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
      >
        {t('error.try_again')}
      </button>
    </div>
  );
}
