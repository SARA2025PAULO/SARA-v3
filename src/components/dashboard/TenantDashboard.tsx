
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Home, MessageSquare, Wallet, ShieldCheck, Receipt, CalendarDays, Award } from "lucide-react"; 
import type { Contract, Property } from "@/types";
import Image from "next/image";
import { Badge } from "@/components/ui/badge"; 
import { AnnouncementsSection } from "./AnnouncementsSection"; // Added import

// Mock data - replace with actual data fetching
const mockTenantContracts: Contract[] = [
  { 
    id: "c1", 
    propertyId: "p1", 
    propertyName: "Av. Siempre Viva 742", 
    landlordId: "landlord1", 
    landlordName: "Ned Flanders", 
    tenantId: "tenant123", 
    tenantEmail: "tenant@example.com",
    startDate: "2023-08-01", 
    endDate: "2024-07-31", 
    rentAmount: 750000, 
    securityDepositAmount: 750000,
    paymentDay: 5,
    status: "Activo", 
    createdAt: "2023-07-15" 
  },
];
const mockPropertyDetails: Property | null = mockTenantContracts.length > 0 ? {
    id: "p1", address: "Av. Siempre Viva 742", status: "Arrendada", description: "Acogedora casa familiar con amplio jardín y garage para dos autos.", ownerId: "landlord1", imageUrl: "https://placehold.co/600x400.png", price: 750000, bedrooms: 3, bathrooms: 2, area: 150
} : null;


export function TenantDashboard() {
  const currentContract = mockTenantContracts.find(c => c.status === "Activo" || c.status === "Pendiente");

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Inquilino</CardTitle>
          <CardDescription>Bienvenido a tu espacio en S.A.R.A.</CardDescription>
        </CardHeader>
        {currentContract && mockPropertyDetails ? (
          <CardContent className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tu Arriendo Actual</CardTitle>
                <CardDescription>{mockPropertyDetails.address}</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div>
                  <Image src={mockPropertyDetails.imageUrl || "https://placehold.co/600x400.png"} alt={mockPropertyDetails.address} width={600} height={400} className="rounded-lg mb-4 object-cover aspect-video" data-ai-hint="house exterior" />
                  <p className="text-sm text-muted-foreground">{mockPropertyDetails.description}</p>
                </div>
                <div className="space-y-3 text-sm">
                  <p><span className="font-semibold">Estado del Contrato:</span> <Badge variant={currentContract.status === "Activo" ? "default" : "secondary"} className={`${currentContract.status === "Activo" ? "bg-accent text-accent-foreground" : "bg-yellow-100 text-yellow-800"}`}>{currentContract.status}</Badge></p>
                  <p><span className="font-semibold">Propietario:</span> {currentContract.landlordName || "N/A"}</p>
                  <p className="flex items-center"><Wallet className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Renta Mensual:</span> ${currentContract.rentAmount.toLocaleString('es-CL')}</p>
                  {currentContract.securityDepositAmount !== undefined && (
                    <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Garantía:</span> ${currentContract.securityDepositAmount.toLocaleString('es-CL')}</p>
                  )}
                  {currentContract.paymentDay && (
                    <p className="flex items-center"><Receipt className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Día de Pago:</span> {currentContract.paymentDay} de cada mes</p>
                  )}
                  <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Inicio de Contrato:</span> {new Date(currentContract.startDate).toLocaleDateString('es-CL')}</p>
                  <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Fin de Contrato:</span> {new Date(currentContract.endDate).toLocaleDateString('es-CL')}</p>
                  <Button asChild className="w-full mt-4">
                    <Link href={`/contratos/${currentContract.id}`}> 
                      <FileText className="mr-2 h-4 w-4" /> Ver Detalles del Contrato
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        ) : (
          <CardContent>
            <div className="text-center py-8">
              <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No tienes contratos activos o pendientes en este momento.</p>
              <p className="text-muted-foreground">Explora propiedades o contacta a un arrendador.</p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos">
                <FileText className="mr-2 h-5 w-5" /> Mis Contratos
              </Link>
            </Button>
             <Button asChild className="w-full justify-start" size="lg">
              <Link href="/dashboard/certificado">
                <Award className="mr-2 h-5 w-5" /> Mi Certificado de Comportamiento
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <Wallet className="mr-2 h-5 w-5" /> Realizar Pago (Próximamente)
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <MessageSquare className="mr-2 h-5 w-5" /> Contactar Arrendador (Próximamente)
            </Button>
          </CardContent>
        </Card>

        <AnnouncementsSection />
      </div>
    </div>
  );
}
