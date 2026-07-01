'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '../../../components/layout/Header';

const SETTINGS_NAV = [
  { label: 'Restaurante', href: '/settings/restaurant' },
  { label: 'Horários', href: '/settings/operating-hours' },
  { label: 'Entrega', href: '/settings/delivery' },
  { label: 'Pagamentos', href: '/settings/payments' },
  { label: 'WhatsApp', href: '/settings/whatsapp' },
  { label: 'Impressoras', href: '/settings/printers' },
  { label: 'Equipe', href: '/settings/team' },
  { label: 'Assinatura', href: '/settings/subscription' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen">
      <Header title="Configurações" />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-56 border-r border-[#2d2d4f] p-4 shrink-0">
          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[#FF6B00]/10 text-[#FF6B00]'
                    : 'text-gray-400 hover:text-white hover:bg-[#1e1e35]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
