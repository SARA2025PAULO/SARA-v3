
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, PlusCircle, Bell } from "lucide-react";
import type { Property, Contract } from "@/types"; // Assuming these types are defined
import Image from "next/image";

// Mock data - replace with actual data fetching
const mockProperties: Property[] = [
  { id: "1", address: "Av. Siempre Viva 742", status: "Arrendada", description: "Casa familiar", ownerId: "landlord1", price: 750000, imageUrl: "https://placehold.co/600x400.png" },
  { id: "2", address: "Calle Falsa 123", status: "Disponible", description: "Apartamento moderno", ownerId: "landlord1", price: 450000, imageUrl: "https://placehold.co/600x400.png" },
];

const mockContracts: Contract[] = [
  { id: "c1", propertyId: "1", tenantId: "tenant1", landlordId: "landlord1", startDate: "2023-01-01", endDate: "2023-12-31", rentAmount: 750000, status: "Activo", propertyName: "Av. Siempre Viva 742", createdAt: "2023-01-01" },
];

export function LandlordDashboard() {
  const totalProperties = mockProperties.length;
  const rentedProperties = mockProperties.filter(p => p.status === "Arrendada").length;
  const activeContracts = mockContracts.filter(c => c.status === "Activo" || c.status === "Pendiente").length;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Arrendador</CardTitle>
          <CardDescription>Gestiona tus propiedades y contratos fácilmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Propiedades registradas</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades Arrendadas</CardTitle>
              <Building2 className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rentedProperties}</div>
              <p className="text-xs text-muted-foreground">Actualmente ocupadas</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeContracts}</div>
              <p className="text-xs text-muted-foreground">Contratos vigentes o pendientes</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/propiedades">
                <Building2 className="mr-2 h-5 w-5" /> Gestionar Propiedades
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/propiedades#nueva">
                <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Propiedad
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos">
                <FileText className="mr-2 h-5 w-5" /> Ver Contratos
              </Link>
            </Button>
             <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos#nuevo">
                <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" /> Notificaciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="Tenant Avatar" width={40} height={40} className="rounded-full" data-ai-hint="person avatar" />
                <div>
                  <p className="text-sm font-medium">Nuevo mensaje de Inquilino X</p>
                  <p className="text-xs text-muted-foreground">Sobre propiedad "Calle Falsa 123"</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-md">
                <FileText className="h-10 w-10 text-accent flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-medium">Contrato para "Av. Siempre Viva" finaliza pronto.</p>
                  <p className="text-xs text-muted-foreground">Vence en 15 días.</p>
                </div>
              </div>
               <p className="text-sm text-muted-foreground text-center pt-2">No hay más notificaciones.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
