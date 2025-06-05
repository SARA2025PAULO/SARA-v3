
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, PlusCircle, Gavel } from "lucide-react"; 
import type { Property, Contract } from "@/types"; 
import Image from "next/image";
import { AnnouncementsSection } from "./AnnouncementsSection"; 

// Mock data - replace with actual data fetching
const mockProperties: Property[] = [
  { id: "1", address: "Av. Siempre Viva 742", status: "Arrendada", description: "Casa familiar", ownerId: "landlord1", price: 750000, imageUrl: "https://placehold.co/600x400.png" },
  { id: "2", address: "Calle Falsa 123", status: "Disponible", description: "Apartamento moderno", ownerId: "landlord1", price: 450000, imageUrl: "https://placehold.co/600x400.png" },
];

const mockContracts: Contract[] = [
  { id: "c1", propertyId: "1", tenantId: "tenant1", landlordId: "landlord1", startDate: "2023-01-01", endDate: "2023-12-31", rentAmount: 750000, securityDepositAmount: 750000, paymentDay: 5, status: "Activo", propertyName: "Av. Siempre Viva 742", createdAt: "2023-01-01", tenantEmail: "tenant@example.com" },
];

export function LandlordDashboard() {
  const totalProperties = mockProperties.length;
  const rentedProperties = mockProperties.filter(p => p.status === "Arrendada").length;
  const activeContracts = mockContracts.filter(c => c.status === "Activo" || c.status === "Pendiente").length;

  return (
    <div className="space-y-6">
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
              <Link href="/propiedades#nueva"> {/* This might need to trigger the dialog instead of hash */}
                <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Propiedad
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos">
                <FileText className="mr-2 h-5 w-5" /> Ver Contratos
              </Link>
            </Button>
             <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos#nuevo"> {/* This might need to trigger the dialog instead of hash */}
                <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg" variant="outline">
              <Link href="/dashboard/recuperacion-legal">
                <Gavel className="mr-2 h-5 w-5" /> Recuperación Legal de Propiedad
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <AnnouncementsSection />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Resumen General</CardTitle>
          <CardDescription>Estadísticas de tus propiedades y contratos.</CardDescription>
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
    </div>
  );
}
