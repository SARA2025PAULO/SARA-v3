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
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-800">Bienvenido a S.A.R.A.</h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10">Sistema de Administración Responsable de Arriendos</p>
        <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 px-8 rounded-full shadow-lg transition duration-300">
          <Link href="/login">Comenzar ahora</Link>
        </Button>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl w-full px-4">
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
        <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-blue-600">Documentación Ley ‘Devuélveme Mi Casa’</CardTitle>
            <CardDescription className="text-gray-700 mt-2">Accede a los formularios y guías necesarios para tu protección legal.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
