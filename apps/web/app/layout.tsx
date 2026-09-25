import type { Metadata, Viewport } from 'next';
import { I18nProvider } from '@/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Toran',
  description:
    'Digital heritage archive and institutional twin for the Dr. Ambedkar National Memorial, 26 Alipur Road, Delhi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /*
    Zoom stays enabled. Disabling it fails WCAG 1.4.4, and this same build is
    the public web app, not only the kiosk. On a kiosk the panel geometry is
    protected by Chromium's own launch flags at deploy time, which is where a
    deployment constraint belongs. Visitors who need larger text get the card
    type scale, which reaches 200% without reflow breaking.
  */
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4efe6' },
    { media: '(prefers-color-scheme: dark)', color: '#141210' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
      suppressHydrationWarning, on this element only.
      
      The document element is deliberately not React's to own after mount. The
      i18n provider rewrites lang and dir on it so CSS :lang() and the Indic
      font stack apply; the twin and the system page set data-theme on it; the
      kiosk and the ruler set --device-scale. All of that lands after
      hydration, but any of it — and any reader's theme extension, which
      rewrites html before React has loaded at all — makes the server's
      markup and the client's disagree about this one tag.
      
      It suppresses the warning one level deep, for this element's own
      attributes. Everything inside it is still checked.
    */
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
