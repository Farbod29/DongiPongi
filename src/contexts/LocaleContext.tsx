'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

type Locale = 'en' | 'fa';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    document.documentElement.dir = newLocale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
    router.refresh();
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

