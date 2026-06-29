import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZappAI - Gestão de Restaurantes',
  description: 'Plataforma completa para gestão de restaurantes',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-[#0f0f1a] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
