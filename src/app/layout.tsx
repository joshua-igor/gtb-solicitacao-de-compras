import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal de Pedidos - O Grupo The Best',
  description: 'Gestão integrada de pedidos e integração Service Desk',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased text-gray-800 bg-gray-50">{children}</body>
    </html>
  );
}
