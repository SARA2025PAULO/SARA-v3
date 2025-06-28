
'use client';

import { DemoRequestForm } from '@/components/ui/DemoRequestForm';
import Link from 'next/link';

export default function SolicitarDemoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Solicita tu Prueba Gratuita
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Déjanos tus datos y nos pondremos en contacto a la brevedad para entregarte tus credenciales de prueba.
          </p>
        </div>
        <div className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md">
          <DemoRequestForm />
        </div>
        <div className="text-sm">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}
