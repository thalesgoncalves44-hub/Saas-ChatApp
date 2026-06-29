import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cardápio Digital - ZappAI',
  description: 'Cardápio digital para restaurantes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
