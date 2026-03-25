import type { Metadata } from 'next';
import { Sora, Source_Serif_4 } from 'next/font/google';
import { JsonLd } from '@/components/json-ld';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { SITE } from '@/lib/constants';
import './globals.css';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['300', '400', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ['AI consulting', 'multi-agent systems', 'AI implementation', 'AI strategy', 'production AI', 'business automation'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{
      url: 'https://askzev.ai/api/og/social?text=Custom%20AI%20systems%20that%20actually%20work&pillar=zev.ai&format=landscape&style=blog',
      width: 1200,
      height: 630,
      alt: 'zev.ai — Custom AI systems that actually work',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
    images: ['https://askzev.ai/api/og/social?text=Custom%20AI%20systems%20that%20actually%20work&pillar=zev.ai&format=landscape&style=blog'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TOLA" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className={`${sora.variable} ${sourceSerif.variable} antialiased`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
