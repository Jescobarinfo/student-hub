import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'USS Student Hub',
  description: 'Portal de notificaciones académicas - Universidad San Sebastián',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
