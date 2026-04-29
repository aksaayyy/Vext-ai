import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: {
    default: 'Vext — Video Intelligence Extractor',
    template: '%s | Vext',
  },
  description: 'Extract structured intelligence from any YouTube video — steps, configs, frameworks, and more.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vext.so'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scanlines">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
