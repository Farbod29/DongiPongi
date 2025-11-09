'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocale } from '@/contexts/LocaleContext';
import { signOut } from 'next-auth/react';

export default function Header() {
  const t = useTranslations();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { locale, setLocale } = useLocale();

  const getThemeIcon = () => {
    if (theme === 'system') {
      return (
        <span className="relative">
          <span className="text-lg">💻</span>
          <span className="absolute -top-1 -right-1 text-xs">
            {resolvedTheme === 'dark' ? '🌙' : '☀️'}
          </span>
        </span>
      );
    }
    return theme === 'light' ? '☀️' : '🌙';
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'System';
    return theme === 'light' ? 'Light' : 'Dark';
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('common.appName')}
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            aria-label={`${t('theme.toggle')} (${getThemeLabel()})`}
            title={`Theme: ${getThemeLabel()}`}
          >
            {getThemeIcon()}
          </button>

          <button
            onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            {locale === 'en' ? 'فا' : 'EN'}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </header>
  );
}

