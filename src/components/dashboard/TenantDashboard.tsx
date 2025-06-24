
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Home, MessageSquare, Wallet, ShieldCheck, Receipt, CalendarDays, Award, Download } from "lucide-react"; 
import type { Contract, Evaluation } from "@/types";
import { Badge } from "@/components/ui/badge"; 
import { AnnouncementsSection } from "./AnnouncementsSection";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

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

  let scoreColor = "text-primary"; // Default color
  if (score >= 4) scoreColor = "text-green-600"; // Use Tailwind green
  else if (score >= 3) scoreColor = "text-yellow-500"; // Use Tailwind yellow
  else if (score > 0) scoreColor = "text-red-600"; // Use Tailwind red

  return (
    <div className="flex items-center justify-center bg-card rounded-lg aspect-video w-full h-auto max-h-[300px] p-4 shadow">
      <svg viewBox="0 0 120 120" className="w-full h-full max-w-[200px] max-h-[200px]">
        <circle cx="60" cy="60" r="55" fill="hsl(var(--background))" strokeWidth="4" className="stroke-primary/30" />
        {/* Optional: Progress ring for score */}
        <circle 
            cx="60" 
            cy="60" 
            r="50" 
            fill="transparent" 
            strokeWidth="8" 
            className={`stroke-current ${scoreColor.replace('text-', 'stroke-')}`} // convert text-color to stroke-color
            strokeDasharray={`${(score / 5.0) * (2 * Math.PI * 50)} ${2 * Math.PI * 50}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
        />
        <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" className={`fill-current ${scoreColor} font-bold text-4xl`}>
          {score.toFixed(1)}
        </text>
        <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" className="fill-current text-muted-foreground font-semibold text-lg">
          / 5.0
        </text>
      </svg>
    </div>
  );
};


export function TenantDashboard() {
  const { currentUser } = useAuth();
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.role === 'Inquilino' && db) {
      setIsLoadingScore(true);
      const fetchScore = async () => {
        try {
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
        } catch (err) {
          console.error("Error fetching tenant score data:", err);
          setGlobalScore(null);
        } finally {
          setIsLoadingScore(false);
        }
      };

      const fetchActiveContract = async () => {
        setIsLoadingContract(true);
        try {
          const contractsQuery = query(collection(db, 'contracts'), where('tenantId', '==', currentUser.uid), where('status', '==', 'Activo'), limit(1));
          const contractSnapshot = await getDocs(contractsQuery);
          if (!contractSnapshot.empty) {
            const contractDoc = contractSnapshot.docs[0];
            setActiveContract({ id: contractDoc.id, ...contractDoc.data() } as Contract);
          } else {
            setActiveContract(null);
          }
        } catch (error) {
          console.error("Error fetching active contract:", error);
          setActiveContract(null);
        } finally {
          setIsLoadingContract(false);
        }
      };

      fetchScore();
      fetchActiveContract();
    } else {
      setIsLoadingScore(false);
      setIsLoadingContract(false);
      setGlobalScore(null);
      setActiveContract(null);
    }
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* NEW: Consistent CardHeader for Tenant Dashboard */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panel de Inquilino</CardTitle>
          <CardDescription>Bienvenido a tu espacio en S.A.R.A.</CardDescription>
          <p className="text-sm text-muted-foreground pt-1">Rol: Inquilino</p>
        </CardHeader>
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
                <Download className="mr-2 h-5 w-5" /> Descargar Certificado
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/pagos">
                <Wallet className="mr-2 h-5 w-5" /> Declarar un Pago
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg" disabled>
                <MessageSquare className="mr-2 h-5 w-5" /> Contactar Arrendador (Próximamente)
            </Button>
          </CardContent>
        </Card>

        <AnnouncementsSection />
      </div>
      
      {isLoadingContract ? (
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      ) : activeContract ? (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Tu Arriendo Actual</CardTitle>
              <CardDescription>{activeContract.propertyName}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="rounded-lg mb-4">
                {isLoadingScore ? 
                  <Skeleton className="rounded-lg aspect-video w-full h-auto max-h-[300px]" /> : 
                  <ScoreDisplay score={globalScore} />
                }
              </div>
              <div className="space-y-3 text-sm">
                <p><span className="font-semibold">Estado del Contrato:</span> <Badge variant={"default"} className="bg-accent text-accent-foreground">{activeContract.status}</Badge></p>
                <p><span className="font-semibold">Propietario:</span> {activeContract.landlordName || "N/A"}</p>
                <p className="flex items-center"><Wallet className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Renta Mensual:</span> ${activeContract.rentAmount.toLocaleString('es-CL')}</p>
                {activeContract.securityDepositAmount !== undefined && (
                  <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Garantía:</span> ${activeContract.securityDepositAmount.toLocaleString('es-CL')}</p>
                )}
                {activeContract.paymentDay && (
                  <p className="flex items-center"><Receipt className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Día de Pago:</span> {activeContract.paymentDay} de cada mes</p>
                )}
                <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Inicio de Contrato:</span> {new Date(activeContract.startDate).toLocaleDateString('es-CL')}</p>
                <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <span className="font-semibold">Fin de Contrato:</span> {new Date(activeContract.endDate).toLocaleDateString('es-CL')}</p>
                <Button asChild className="w-full mt-4">
                  <Link href="/contratos"> 
                    <FileText className="mr-2 h-4 w-4" /> Ver Detalles del Contrato
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent>
              <div className="text-center py-8">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No tienes contratos activos o pendientes en este momento.</p>
                <p className="text-muted-foreground">Explora propiedades o contacta a un arrendador.</p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}