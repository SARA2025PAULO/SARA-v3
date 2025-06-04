import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

export const metadata: Metadata = {
  title: 'S.A.R.A - Sistema de Administración Responsable de Arriendos',
  description: 'Plataforma para la administración de arriendos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
