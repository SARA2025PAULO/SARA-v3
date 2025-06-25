"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, FileText, PlusCircle, Gavel, Upload, Calendar, Wallet, AlertTriangle,
  Timer, CheckCircle, XCircle, BarChart, Users, Megaphone, ClipboardCheck, DollarSign, PieChart as PieChartIcon
} from "lucide-react";
import type { Property, Contract, Payment, Incident, Evaluation } from "@/types";
import { AnnouncementsSection } from "./AnnouncementsSection";
import BulkUploadModal from "@/components/properties/BulkUploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import moment from 'moment';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export function LandlordDashboard() {
  const { currentUser } = useAuth();
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const landlordId = currentUser.uid;

      // Fetch Properties
      const propertiesQuery = query(collection(db, "propiedades"), where("ownerId", "==", landlordId));
      const propertiesSnapshot = await getDocs(propertiesQuery);
      const propertiesList = propertiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Property);
      setProperties(propertiesList);

      // Fetch Contracts
      const contractsQuery = query(collection(db, "contracts"), where("landlordId", "==", landlordId));
      const contractsSnapshot = await getDocs(contractsQuery);
      const contractsList = contractsSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() as Contract,
        startDate: (doc.data() as Contract).startDate?.toDate ? (doc.data() as Contract).startDate.toDate() : (doc.data() as Contract).startDate,
        endDate: (doc.data() as Contract).endDate?.toDate ? (doc.data() as Contract).endDate.toDate() : (doc.data() as Contract).endDate,
      }) as Contract);
      setContracts(contractsList);

      // Fetch Payments
      const paymentsQuery = query(collection(db, "pagos"), where("landlordId", "==", landlordId));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsList = paymentsSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() as Payment,
        date: (doc.data() as Payment).date?.toDate ? (doc.data() as Payment).date.toDate() : (doc.data() as Payment).date,
      }) as Payment);
      setPayments(paymentsList);

      // Fetch Incidents
      const incidentsQuery = query(collection(db, "incidents"), where("landlordId", "==", landlordId));
      const incidentsSnapshot = await getDocs(incidentsQuery);
      const incidentsList = incidentsSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() as Incident,
        createdAt: (doc.data() as Incident).createdAt?.toDate ? (doc.data() as Incident).createdAt.toDate() : (doc.data() as Incident).createdAt,
      }) as Incident);
      setIncidents(incidentsList);

      // Fetch Evaluations
      const evaluationsQuery = query(collection(db, "evaluations"), where("landlordId", "==", landlordId));
      const evaluationsSnapshot = await getDocs(evaluationsQuery);
      const evaluationsList = evaluationsSnapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() as Evaluation,
        evaluationDate: (doc.data() as Evaluation).evaluationDate?.toDate ? (doc.data() as Evaluation).evaluationDate.toDate() : (doc.data() as Evaluation).evaluationDate,
      }) as Evaluation);
      setEvaluations(evaluationsList);

    } catch (error) {
      console.error("Error fetching landlord dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadSuccess = () => {
    fetchData(); // Refresh data after bulk upload
  };

  // --- Derived Metrics ---
  const totalProperties = properties.length;
  const activeContractsCount = contracts.filter(c => c.status === "activo").length;
  const pendingContractsCount = contracts.filter(c => c.status === "pendiente").length;
  const expiringContractsCount = contracts.filter(c => {
    const endDate = moment(c.endDate);
    const now = moment();
    return c.status === "activo" && endDate.isAfter(now) && endDate.isSameOrBefore(now.clone().add(3, 'months'), 'day');
  }).length;

  const openIncidentsCount = incidents.filter(i => i.status !== "cerrado").length;
  const pendingEvaluationsCount = evaluations.filter(e => e.status === "pendiente de confirmacion").length;

  const currentMonthMoment = moment().startOf('month');
  const currentMonthPaymentsReceived = payments.filter(p => {
    const paymentMoment = moment(p.date);
    return p.status === "Pagado" && paymentMoment.isSame(currentMonthMoment, 'month');
  }).reduce((sum, payment) => sum + payment.amount, 0);

  const overduePaymentsCount = contracts.filter(contract => {
    if (contract.status !== "activo") return false;

    const expectedPaymentDay = contract.rentPaymentDay || 5;
    let expectedPaymentDate = moment().date(expectedPaymentDay).startOf('day');

    if (moment().isBefore(expectedPaymentDate, 'day')) return false;

    const paidThisMonth = payments.some(p => {
      const pDate = moment(p.date);
      return p.contractId === contract.id && p.status === "Pagado" && pDate.isSame(expectedPaymentDate, 'month');
    });
    
    return !paidThisMonth;
  }).length;

  const overallTenantScore = evaluations.length > 0 
    ? (evaluations.reduce((sum, e) => sum + 
        ((e.criteria?.paymentPunctuality || 0) + (e.criteria?.propertyCare || 0) + 
         (e.criteria?.communication || 0) + (e.criteria?.generalBehavior || 0)) / 4
      , 0) / evaluations.length).toFixed(1)
    : "N/A";

  // --- Data for Charts ---

  // Properties Chart Data
  const propertiesData = Object.entries(
    properties.reduce((acc, property) => {
      acc[property.status] = (acc[property.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const PROPERTIES_COLORS = {
    "Disponible": "#82ca9d", // Green
    "Arrendada": "#8884d8", // Purple
    "Mantenimiento": "#ffc658", // Yellow
  };

  // Contracts Chart Data
  const contractsData = Object.entries(
    contracts.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const CONTRACTS_COLORS = {
    "activo": "#4CAF50", // Green
    "pendiente": "#FFC107", // Amber
    "finalizado": "#9E9E9E", // Grey
    "rechazado": "#F44336", // Red
  };

  // Incidents Chart Data
  const incidentsData = Object.entries(
    incidents.reduce((acc, incident) => {
      acc[incident.status] = (acc[incident.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const INCIDENTS_COLORS = {
    "abierto": "#FFC107", // Amber
    "en proceso": "#2196F3", // Blue
    "cerrado": "#4CAF50", // Green
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Card & Action Required Alert */}
      <Card className="shadow-lg border-l-4 border-primary">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold font-headline text-primary">Panel de Arrendador</CardTitle>
          <CardDescription className="text-lg">Bienvenido a tu espacio de gestión centralizado en S.A.R.A.</CardDescription>
          <p className="text-md text-muted-foreground pt-1">Rol: {currentUser?.role}</p>
        </CardHeader>
        {(pendingContractsCount > 0 || overduePaymentsCount > 0 || openIncidentsCount > 0 || expiringContractsCount > 0) && (
          <CardContent>
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-4 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-bold text-lg text-red-700 dark:text-red-300">¡Atención Requerida!</p>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                  {pendingContractsCount > 0 && <li><Link href="/contratos" className="underline">Tienes {pendingContractsCount} contrato(s) pendiente(s) de revisión del inquilino.</Link></li>}
                  {overduePaymentsCount > 0 && <li><Link href="/pagos" className="underline">Hay {overduePaymentsCount} pago(s) de arriendo atrasado(s).</Link></li>}
                  {openIncidentsCount > 0 && <li><Link href="/incidentes" className="underline">Hay {openIncidentsCount} incidente(s) abierto(s) que requieren tu atención.</Link></li>}
                  {expiringContractsCount > 0 && <li><Link href="/contratos" className="underline">Tienes {expiringContractsCount} contrato(s) próximos a vencer.</Link></li>}
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Charts Section - Now main focus */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Properties Status Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Estado de Propiedades</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {propertiesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertiesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {propertiesData.map((entry, index) => (
                      <Cell key={`cell-properties-${index}`} fill={PROPERTIES_COLORS[entry.name as keyof typeof PROPERTIES_COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} (${((value / totalProperties) * 100).toFixed(1)}%)`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de propiedades para mostrar.</div>
            )}
          </CardContent>
        </Card>

        {/* Contracts Status Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Estado de Contratos</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {contractsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contractsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {contractsData.map((entry, index) => (
                      <Cell key={`cell-contracts-${index}`} fill={CONTRACTS_COLORS[entry.name as keyof typeof CONTRACTS_COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} (${((value / contracts.length) * 100).toFixed(1)}%)`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de contratos para mostrar.</div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Status Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Estado de Incidentes</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            {incidentsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {incidentsData.map((entry, index) => (
                      <Cell key={`cell-incidents-${index}`} fill={INCIDENTS_COLORS[entry.name as keyof typeof INCIDENTS_COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${value} (${((value / incidents.length) * 100).toFixed(1)}%)`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de incidentes para mostrar.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Announcements Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Acciones Rápidas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/propiedades">
                    <Building2 className="mr-2 h-5 w-5" /> Gestionar Propiedades
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver y administrar todas tus propiedades.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/propiedades#nueva">
                    <PlusCircle className="mr-2 h-5 w-5" /> Añadir Propiedad
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Registra una nueva propiedad para arrendar.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/contratos">
                    <FileText className="mr-2 h-5 w-5" /> Ver Contratos
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Revisa el estado de todos tus contratos.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/contratos#nuevo">
                    <PlusCircle className="mr-2 h-5 w-5" /> Crear Contrato
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Genera un nuevo contrato de arrendamiento.</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/calendario">
                    <Calendar className="mr-2 h-5 w-5" /> Calendario
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Consulta las fechas clave de tus contratos.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg" variant="outline">
                  <Link href="/dashboard/recuperacion-legal">
                    <Gavel className="mr-2 h-5 w-5" /> Recuperación Legal
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Accede a herramientas para procesos de recuperación legal.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="w-full justify-start" size="lg" onClick={() => setIsBulkUploadModalOpen(true)}>
                  <Upload className="mr-2 h-5 w-5" /> Carga Masiva
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sube múltiples propiedades a la vez desde un archivo.</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>
        <AnnouncementsSection />
      </div>

      <BulkUploadModal isOpen={isBulkUploadModalOpen} onClose={() => setIsBulkUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
