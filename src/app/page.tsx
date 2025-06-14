"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";

export default function HomePage() {

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-white">
      {/* Hero Section */}
      <div className="text-center mb-10 w-full max-w-6xl">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-800">Bienvenido a S.A.R.A.</h1> {/* Added w-full max-w-6xl for better centering control */}
        <p className="text-xl md:text-2xl text-gray-600 mb-10">Sistema de Administración Responsable de Arriendos</p>
        <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 px-8 rounded-full shadow-lg transition duration-300">
          <Link href="/login">Comenzar ahora</Link>
        </Button>
      </div>
      {/* The S.A.R.A. Rent Report Section was moved below */}

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl w-full px-4">
        {/* Cards for Features */}
 <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
 <CardTitle className="text-xl font-semibold text-blue-600">Genera Contratos</CardTitle>
 <CardDescription className="text-gray-700 mt-2">crea contratos personalizados para tus propiedades.</CardDescription>
 </CardHeader>
 </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
 <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-600">Evalúa a tu Inquilino</CardTitle>
            <CardDescription className="text-gray-700 mt-2">Obtén información confiable para seleccionar al mejor arrendatario.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
 <CardTitle className="text-xl font-semibold text-blue-600">Certificado de Comportamiento</CardTitle>
            <CardDescription className="text-gray-700 mt-2">Genera y descarga certificados que avalen el historial de tu inquilino.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 md:col-span-3 md:flex md:justify-center">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-600">Documentación Ley ‘Devuélveme Mi Casa’</CardTitle>
            <CardDescription className="text-gray-700 mt-2">Accede a los formularios y guías necesarios para tu protección legal.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* S.A.R.A. Rent Report Section - Centered */}
      <section className="w-full flex justify-center my-10">
        <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center max-w-sm w-full"> {/* Added max-w-sm and w-full for better centering and sizing */}
          <p className="text-lg md:text-xl text-gray-700 mb-6">El Informe S.A.R.A. Rent te brinda información detallada sobre el comportamiento de un arrendador.</p>
          <Button size="lg" asChild className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8 rounded-full shadow-lg transition duration-300">
            <Link href="/informe-sara-rent">Obtener informe</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
