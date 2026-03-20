import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kemeselot Admin',
  description: 'Admin Dashboard for manual payment approval',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
