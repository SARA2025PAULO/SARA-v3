"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Home, MessageSquare, Wallet, ShieldCheck, Receipt, CalendarDays, Award, Download, Calendar, AlertTriangle } from "lucide-react"; 
import type { Contract, Evaluation } from "@/types";
import { Badge } from "@/components/ui/badge"; 
import { AnnouncementsSection } from "./AnnouncementsSection";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"; // Import Tooltip components

// --- ScoreDisplay Component (no changes) ---
const ScoreDisplay = ({ score }: { score: number | null }) => {
  if (score === null) {
    return (
      <div className="flex items-center justify-center bg-muted rounded-lg aspect-video w-full h-auto max-h-[300px] text-muted-foreground p-4 shadow">
        <div className="text-center">
          <Award className="h-16 w-16 mx-auto mb-2 text-primary/70" />
          <p className="text-xl font-semibold">Sin Calificación</p>
          <p className="text-sm">Aún no hay evaluaciones disponibles.</p>
        </div>
      </div>
    );
  }
  let scoreColor = score >= 4 ? "text-green-600" : score >= 3 ? "text-yellow-500" : "text-red-600";
  return (
    <div className="flex items-center justify-center bg-card rounded-lg aspect-video w-full h-auto max-h-[300px] p-4 shadow">
      <svg viewBox="0 0 120 120" className="w-full h-full max-w-[200px] max-h-[200px]">
        <circle cx="60" cy="60" r="55" fill="hsl(var(--background))" strokeWidth="4" className="stroke-primary/30" />
        <circle 
            cx="60" cy="60" r="50" fill="transparent" strokeWidth="8" 
            className={`stroke-current ${scoreColor.replace('text-', 'stroke-')}`}
            strokeDasharray={`${(score / 5.0) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`}
            strokeLinecap="round" transform="rotate(-90 60 60)" />
        <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" className={`fill-current ${scoreColor} font-bold text-4xl`}>{score.toFixed(1)}</text>
        <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" className="fill-current text-muted-foreground font-semibold text-lg">/ 5.0</text>
      </svg>
    </div>
  );
};


export function TenantDashboard() {
  const { currentUser } = useAuth();
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [pendingContract, setPendingContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Inquilino') {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch contracts (active and pending) - CORRECTED to lowercase 'activo' and 'pendiente'
        const contractsQuery = query(collection(db, 'contracts'), where('tenantId', '==', currentUser.uid), where('status', 'in', ['activo', 'pendiente']));
        const contractSnapshot = await getDocs(contractsQuery);
        // CORRECTED: Filter by lowercase 'activo' and 'pendiente'
        const active = contractSnapshot.docs.find(doc => doc.data().status === 'activo');
        const pending = contractSnapshot.docs.find(doc => doc.data().status === 'pendiente');
        setActiveContract(active ? { id: active.id, ...active.data() } as Contract : null);
        setPendingContract(pending ? { id: pending.id, ...pending.data() } as Contract : null);

        // Fetch user score
        const evalsQuery = query(collection(db, "evaluations"), where("tenantId", "==", currentUser.uid));
        const evalsSnapshot = await getDocs(evalsQuery);
        const allTenantEvaluations = evalsSnapshot.docs.map(docSnap => docSnap.data() as Evaluation);
        if (allTenantEvaluations.length > 0) {
          const numEvals = allTenantEvaluations.length;
          const avgPunctuality = allTenantEvaluations.reduce((sum, e) => sum + e.criteria.paymentPunctuality, 0) / numEvals;
          const avgPropertyCare = allTenantEvaluations.reduce((sum, e) => sum + e.criteria.propertyCare, 0) / numEvals;
          const avgCommunication = allTenantEvaluations.reduce((sum, e) => sum + e.criteria.communication, 0) / numEvals;
          const avgGeneralBehavior = allTenantEvaluations.reduce((sum, e) => sum + e.criteria.generalBehavior, 0) / numEvals;
          const overallAvg = (avgPunctuality + avgPropertyCare + avgCommunication + avgGeneralBehavior) / 4;
          setGlobalScore(parseFloat(overallAvg.toFixed(1)));
        } else {
          setGlobalScore(null);
        }
      } catch (error) {
        console.error("Error fetching tenant dashboard data:", error);
        setGlobalScore(null);
        setActiveContract(null);
        setPendingContract(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Inquilino</CardTitle>
          <CardDescription>Bienvenido a tu espacio en S.A.R.A.</CardDescription>
          <p className="text-sm text-muted-foreground pt-1">Rol: Inquilino</p>
        </CardHeader>
        {pendingContract && (
          <CardContent>
            <Link href="/contratos">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-4 animate-pulse">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-semibold">¡Tienes un contrato pendiente!</p>
                  <p className="text-sm">Un arrendador te ha enviado un nuevo contrato para su revisión y aprobación.</p>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/contratos">
                    <FileText className="mr-2 h-5 w-5" /> Mis Contratos
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Revisa y gestiona tus contratos de arriendo.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/calendario">
                    <Calendar className="mr-2 h-5 w-5" /> Mi Calendario
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Consulta tus fechas importantes de arriendo.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/dashboard/certificado">
                    <Download className="mr-2 h-5 w-5" /> Descargar Certificado
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Obtén tu certificado de comportamiento de inquilino.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild className="w-full justify-start" size="lg">
                  <Link href="/pagos">
                    <Wallet className="mr-2 h-5 w-5" /> Declarar un Pago
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Registra un pago de arriendo realizado.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                    <MessageSquare className="mr-2 h-5 w-5" /> Contactar Arrendador (Próximamente)
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Funcionalidad para contactar directamente a tu arrendador.</p>
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <AnnouncementsSection />
      </div>
      
      {activeContract ? (
        <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tu Arriendo Actual</CardTitle>
              <CardDescription>{activeContract.propertyName}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg mb-4"><ScoreDisplay score={globalScore} /></div>
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold">Estado:</span> <Badge>{activeContract.status}</Badge></p>
                <p><span className="font-semibold">Propietario:</span> {activeContract.landlordName || "N/A"}</p>
                <p><Wallet className="inline h-4 w-4 mr-2" /> <span className="font-semibold">Renta:</span> ${activeContract.rentAmount.toLocaleString('es-CL')}</p>
                <p><CalendarDays className="inline h-4 w-4 mr-2" /> <span className="font-semibold">Fin:</span> {new Date(activeContract.endDate).toLocaleDateString('es-CL')}</p>
                <Button asChild className="w-full mt-4"><Link href="/contratos"><FileText className="mr-2 h-4 w-4" /> Ver Detalles del Contrato</Link></Button>
              </div>
            </CardContent>
        </Card>
      ) : !pendingContract && (
        <Card className="shadow-lg">
          <CardContent className="text-center py-8">
            <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No tienes contratos activos en este momento.</p>
            <p className="text-muted-foreground">Cuando un arrendador te envíe un contrato, aparecerá aquí.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
