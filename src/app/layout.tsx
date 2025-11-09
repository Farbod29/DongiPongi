import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'DongyPongy - Split Expenses Easily',
  description: 'Calculate and share costs with friends and family',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value || 'en') as 'en' | 'fa';
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === 'fa' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var resolved = theme;
                  
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.add(resolved);
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <LocaleProvider initialLocale={locale}>
              <ThemeProvider>{children}</ThemeProvider>
            </LocaleProvider>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}

