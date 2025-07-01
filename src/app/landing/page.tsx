'use client';

import React from 'react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
          Bienvenido a S.A.R.A
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl">
          Tu Asistente de Arriendo y Recuperación Automatizada. Simplificamos la gestión de propiedades para arrendadores y la vida de los inquilinos.
        </p>
        {/* Los botones de acción ahora están en el Header */}
      </section>

      {/* Features Section */}
      <section className="w-full py-12 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Funcionalidades Principales</h2>
          <div className="flex flex-wrap -mx-4">
            
            <div className="w-full md:w-1/3 px-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Gestión de Propiedades</h3>
                <p className="text-gray-600">
                  Administra todas tus propiedades en un solo lugar. Sube documentos, asigna inquilinos y lleva un registro completo.
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 px-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Control de Pagos</h3>
                <p className="text-gray-600">
                  Registra y monitorea los pagos de arriendo de forma sencilla, con notificaciones y recordatorios automáticos.
                </p>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 px-4 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Comunicación Directa</h3>
                <p className="text-gray-600">
                  Un canal de comunicación directo y documentado entre arrendadores e inquilinos para gestionar incidentes y solicitudes.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
