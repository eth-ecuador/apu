import type { Metadata } from "next";
import { Providers } from "../providers";
import { Outfit } from 'next/font/google';
import "./globals.css";

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "APU - Privacy-Preserving Medical AI",
  description: "Production-grade medical AI with Zama FHE, 0G Storage & 0G Compute TEE for privacy-preserving diagnosis",
  icons: {
    icon: [
      { url: '/apu-mark-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/apu-mark-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/apu-mark-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/apu-mark-256.png', sizes: '256x256', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className={`${outfit.className} bg-apu-paper text-apu-ink`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
