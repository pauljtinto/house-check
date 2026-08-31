import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'House Check',
  description: 'Is this a reasonable purchase for Paul and Armando?',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
