import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-expect-error CSS module is handled by Next.js at build time.
import "@/styles/globals.css";
import { Providers } from "@/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'DevNexus - AI-Enhanced Social Learning Network for Engineers',
    template: '%s | DevNexus',
  },
  description:
    'The learning network built for engineers. Connect, learn, and grow with AI-powered insights and a community of passionate developers.',
  keywords: [
    'software engineering',
    'learning network',
    'AI learning',
    'developer community',
    'coding',
    'programming',
  ],
  authors: [{ name: 'DevNexus Team' }],
  openGraph: {
    type: 'website',
    siteName: 'DevNexus',
    title: 'DevNexus - AI-Enhanced Social Learning Network',
    description: 'The learning network built for engineers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevNexus - AI-Enhanced Social Learning Network',
    description: 'The learning network built for engineers.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning  // ✅ BẮT BUỘC cho next-themes — tránh hydration mismatch
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

