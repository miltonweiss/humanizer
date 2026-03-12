import { Fraunces, Manrope, Geist_Mono } from 'next/font/google';
import './globals.css';

const displayFont = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
});

const bodyFont = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
});

const monoFont = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Humanizer Studio',
  description:
    'Humanizer Studio rewrites AI-generated drafts with premium editorial controls and quality feedback.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" data-motion="normal">
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
