import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import Background from '@/components/Background'
import Navbar from '@/components/Navbar'
import { getDictionary, Locale } from '@/lib/i18n'
import { getCurrentUser, initializeAdmin } from '@/lib/auth'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://html2png.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HTML2PNG - Convert HTML to High-Quality PNG Images',
    template: '%s | HTML2PNG',
  },
  description: 'Free online tool to convert HTML to PNG images. Support high-DPI (Retina), full-page screenshots, custom viewport sizes, and API access. Self-hosted, open-source.',
  keywords: [
    'HTML to PNG',
    'HTML to image',
    'screenshot API',
    'webpage screenshot',
    'HTML converter',
    'PNG generator',
    'web capture',
    'HTML renderer',
    'Retina screenshot',
    'high-DPI image',
    'full page screenshot',
    'self-hosted',
    'open source',
  ],
  authors: [{ name: 'HTML2PNG' }],
  creator: 'HTML2PNG',
  publisher: 'HTML2PNG',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'zh_CN',
    url: siteUrl,
    siteName: 'HTML2PNG',
    title: 'HTML2PNG - Convert HTML to High-Quality PNG Images',
    description: 'Free online tool to convert HTML to PNG images. Support high-DPI, full-page screenshots, and API access.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HTML2PNG - HTML to Image Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HTML2PNG - Convert HTML to High-Quality PNG Images',
    description: 'Free online tool to convert HTML to PNG images. Support high-DPI, full-page screenshots, and API access.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': siteUrl,
      'zh': `${siteUrl}?lang=zh`,
    },
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize admin account from env if not exists
  await initializeAdmin()

  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value || 'en') as Locale
  const dict = getDictionary(locale)
  const user = await getCurrentUser()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'HTML2PNG',
    description: 'Convert HTML to high-quality PNG images with customizable options',
    url: siteUrl,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'HTML to PNG conversion',
      'High-DPI (Retina) support',
      'Full page screenshots',
      'Custom viewport sizes',
      'API access',
      'Self-hosted option',
    ],
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        <Background />
        <Navbar dict={dict} locale={locale} user={user} />
        <main className="pt-[70px]">
          {children}
        </main>
      </body>
    </html>
  )
}
