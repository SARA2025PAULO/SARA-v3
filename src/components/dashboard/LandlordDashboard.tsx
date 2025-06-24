"use client";

import Link from "next/link";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, PlusCircle, Gavel, Upload } from "lucide-react";
import type { Property, Contract, Payment } from "@/types";
import Image from "next/image";
import { AnnouncementsSection } from "./AnnouncementsSection";
import BulkUploadModal from "@/components/properties/BulkUploadModal";

import { collection, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";

const mockContracts: Contract[] = [
  { id: "c1", propertyId: "1", tenantId: "tenant1", landlordId: "landlord1", startDate: "2023-01-01", endDate: "2023-12-31", rentAmount: 750000, securityDepositAmount: 750000, paymentDay: 5, status: "Activo", propertyName: "Av. Siempre Viva 742", createdAt: "2023-01-01", tenantEmail: "tenant@example.com" },
];

const mockPayments: Payment[] = [
  { id: "p1", contractId: "c1", amount: 750000, date: "2023-02-05", status: "Pagado" },
  { id: "p2", contractId: "c1", amount: 750000, date: "2023-03-05", status: "Pagado" },
];

export function LandlordDashboard() {
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  console.log('Rendering LandlordDashboard, isBulkUploadModalOpen:', isBulkUploadModalOpen);

  const fetchProperties = async () => {
    console.log("Fetching properties from Firestore...");
    const propertiesCollection = collection(db, "propiedades");
    const propertySnapshot = await getDocs(propertiesCollection);
    const propertiesList = propertySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Property
    }));
    setProperties(propertiesList);
    console.log("Properties fetched:", propertiesList.length);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleUploadSuccess = () => {
      fetchProperties();
  };

  const totalProperties = properties.length;
  const totalPaymentsReceived = mockPayments.filter(p => p.status === "Pagado").reduce((sum, payment) => sum + payment.amount, 0);
  const activeContracts = mockContracts.filter(c => c.status === "Activo" || c.status === "Pendiente").length;

  return (
    <div className="space-y-6">
      {/* NEW: Consistent CardHeader for Landlord Dashboard */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Arrendador</CardTitle>
          <CardDescription>Bienvenido a tu espacio en S.A.R.A.</CardDescription>
          <p className="text-sm text-muted-foreground pt-1">Rol: Arrendador</p>
        </CardHeader>
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
            <Button asChild className="w-full justify-start" size="lg" variant="outline">
              <Link href="/dashboard/recuperacion-legal">
                <Gavel className="mr-2 h-5 w-5" /> Recuperación Legal de Propiedad
              </Link>
            </Button>
             <Button className="w-full justify-start" size="lg" onClick={() => {
               setIsBulkUploadModalOpen(true);
               console.log('Carga Masiva button clicked, setting isBulkUploadModalOpen to true');
             }}>
              <Upload className="mr-2 h-5 w-5" /> Carga Masiva de Propiedades
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
              <CardTitle className="text-sm font-medium">Pagos Recibidos (Total)</CardTitle>
              <FileText className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaymentsReceived.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Suma de pagos marcados como 'Pagado'</p>
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
      <BulkUploadModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}