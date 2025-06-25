
"use client";

import Link from "next/link";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, FileText, PlusCircle, Gavel, Upload, Calendar, Wallet, AlertTriangle } from "lucide-react";
import type { Property, Contract, Payment } from "@/types";
import { AnnouncementsSection } from "./AnnouncementsSection";
import BulkUploadModal from "@/components/properties/BulkUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export function LandlordDashboard() {
  const { currentUser } = useAuth();
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch Properties
      const propertiesQuery = query(collection(db, "propiedades"), where("landlordId", "==", currentUser.uid));
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertiesList = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Property);
      setProperties(propertiesList);

      // Fetch Contracts
      const contractsQuery = query(collection(db, "contracts"), where("landlordId", "==", currentUser.uid));
      const contractsSnapshot = await getDocs(contractsQuery);
      const contractsList = contractsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Contract);
      setContracts(contractsList);
      
      // TODO: Fetch Payments associated with contracts

    } catch (error) {
      console.error("Error fetching landlord dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleUploadSuccess = () => {
    fetchData(); // Refresh data after bulk upload
  };

  const totalProperties = properties.length;
  const activeContractsCount = contracts.filter(c => c.status === "Activo").length;
  const pendingContractsCount = contracts.filter(c => c.status === "Pendiente").length;
  // const totalPaymentsReceived = payments.filter(p => p.status === "Pagado").reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Arrendador</CardTitle>
          <CardDescription>Bienvenido a tu espacio en S.A.R.A.</CardDescription>
          <p className="text-sm text-muted-foreground pt-1">Rol: {currentUser?.role}</p>
        </CardHeader>
        {pendingContractsCount > 0 && (
          <CardContent>
            <Link href="/contratos">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-semibold">Acción Requerida</p>
                  <p className="text-sm">
                    Tienes {pendingContractsCount} contrato(s) pendiente(s) de revisión por parte del inquilino.
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" size="lg"><Link href="/propiedades"><Building2 className="mr-2 h-5 w-5" /> Gestionar Propiedades</Link></Button>
            <Button asChild className="w-full justify-start" size="lg"><Link href="/propiedades#nueva"><PlusCircle className="mr-2 h-5 w-5" /> Añadir Propiedad</Link></Button>
            <Button asChild className="w-full justify-start" size="lg"><Link href="/contratos"><FileText className="mr-2 h-5 w-5" /> Ver Contratos</Link></Button>
            <Button asChild className="w-full justify-start" size="lg"><Link href="/contratos#nuevo"><PlusCircle className="mr-2 h-5 w-5" /> Crear Contrato</Link></Button>
            <Button asChild className="w-full justify-start" size="lg"><Link href="/calendario"><Calendar className="mr-2 h-5 w-5" /> Calendario</Link></Button>
            <Button asChild className="w-full justify-start" size="lg" variant="outline"><Link href="/dashboard/recuperacion-legal"><Gavel className="mr-2 h-5 w-5" /> Recuperación Legal</Link></Button>
            <Button className="w-full justify-start" size="lg" onClick={() => setIsBulkUploadModalOpen(true)}><Upload className="mr-2 h-5 w-5" /> Carga Masiva</Button>
          </CardContent>
        </Card>
        <AnnouncementsSection />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>Estadísticas de tus propiedades y contratos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Propiedades</CardTitle><Building2 className="h-5 w-5 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalProperties}</div><p className="text-xs text-muted-foreground">Propiedades registradas</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Contratos Activos</CardTitle><FileText className="h-5 w-5 text-green-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeContractsCount}</div><p className="text-xs text-muted-foreground">Contratos vigentes</p></CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pagos Recibidos</CardTitle><Wallet className="h-5 w-5 text-primary" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">N/A</div><p className="text-xs text-muted-foreground">Total de este mes</p></CardContent>
          </Card>
        </CardContent>
      </Card>

      <BulkUploadModal isOpen={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
