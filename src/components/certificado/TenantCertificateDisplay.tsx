
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { UserProfile, TenantCertificateData, Contract, Property, Evaluation, Payment, Incident, TenantRentalHistory, TenantEvaluationsSummary, TenantPaymentsSummary, TenantIncidentsSummary } from "@/types";
import { collection, doc, getDoc, getDocs, query, where, orderBy, collectionGroup, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Printer, Loader2, AlertCircle, Star, AlertOctagon } from "lucide-react";
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

// Helper to safely format dates, defaulting to 'N/A'
const formatDateSafe = (dateInput: string | Date | Timestamp | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateInput) return 'N/A';
  try {
    const date = dateInput instanceof Timestamp ? dateInput.toDate() : new Date(dateInput);
    return date.toLocaleDateString('es-CL', options || { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return 'Fecha Inválida';
  }
};


async function fetchTenantCertificateData(tenantUid: string): Promise<TenantCertificateData | null> {
  if (!db) {
    console.error("Firestore instance (db) is not available.");
    return null;
  }

  const tenantDocRef = doc(db, "users", tenantUid);
  const tenantDocSnap = await getDoc(tenantDocRef);

  if (!tenantDocSnap.exists() || tenantDocSnap.data()?.role !== 'Inquilino') {
    console.error("Tenant profile not found or role is not Inquilino for UID:", tenantUid);
    return null;
  }
  const tenantProfileData = tenantDocSnap.data();
  const tenantProfile = { 
    uid: tenantDocSnap.id, 
    email: tenantProfileData.email,
    role: tenantProfileData.role,
    displayName: tenantProfileData.displayName,
    createdAt: tenantProfileData.createdAt // Assuming this is stored as ISO string or Timestamp
  } as UserProfile;
  
  const contractsQuery = query(collection(db, "contracts"), where("tenantId", "==", tenantUid), orderBy("startDate", "desc"));
  const contractsSnapshot = await getDocs(contractsQuery);
  const contractsData: Contract[] = contractsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contract));

  const rentalHistory: TenantRentalHistory[] = [];
  let allEvaluations: Evaluation[] = [];
  let allPayments: Payment[] = [];
  let allIncidents: Incident[] = [];

  for (const contract of contractsData) {
    let landlordName = contract.landlordName || "Arrendador Desconocido";
    if (contract.landlordId) {
        const landlordDocRef = doc(db, "users", contract.landlordId);
        const landlordDocSnap = await getDoc(landlordDocRef);
        if (landlordDocSnap.exists()) {
            landlordName = landlordDocSnap.data()?.displayName || landlordName;
        }
    }

    rentalHistory.push({
      contractId: contract.id,
      propertyAddress: contract.propertyName || `Propiedad ID: ${contract.propertyId.substring(0,8)}`,
      startDate: formatDateSafe(contract.startDate),
      endDate: formatDateSafe(contract.endDate),
      landlordName: landlordName,
    });

    const evaluationsQuery = query(collection(db, "evaluations"), where("contractId", "==", contract.id), where("tenantId", "==", tenantUid));
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    evaluationsSnapshot.docs.forEach(docSnap => allEvaluations.push({ id: docSnap.id, ...docSnap.data() } as Evaluation));

    // Fetch payments specifically for this contract to check `isOverdue`
    const paymentsContractQuery = query(collection(db, "contracts", contract.id, "payments"), where("tenantId", "==", tenantUid));
    const paymentsContractSnapshot = await getDocs(paymentsContractQuery);
    paymentsContractSnapshot.docs.forEach(docSnap => allPayments.push({ id: docSnap.id, ...docSnap.data()} as Payment));
    
    const incidentsTenantQuery = query(collection(db, "incidents"), where("contractId", "==", contract.id), where("tenantId", "==", tenantUid));
    const incidentsTenantSnapshot = await getDocs(incidentsTenantQuery);
    incidentsTenantSnapshot.docs.forEach(docSnap => {
        if(!allIncidents.find(i => i.id === docSnap.id)) allIncidents.push({ id: docSnap.id, ...docSnap.data()} as Incident);
    });
    
    const incidentsCreatedByTenantQuery = query(collection(db, "incidents"), where("contractId", "==", contract.id), where("createdBy", "==", tenantUid));
    const incidentsCreatedByTenantSnapshot = await getDocs(incidentsCreatedByTenantQuery);
    incidentsCreatedByTenantSnapshot.docs.forEach(docSnap => {
        if(!allIncidents.find(i => i.id === docSnap.id)) allIncidents.push({ id: docSnap.id, ...docSnap.data()} as Incident);
    });
  }
  
  let evalSummary: TenantEvaluationsSummary = {
    averagePunctuality: null, averagePropertyCare: null, averageCommunication: null, averageGeneralBehavior: null,
    overallAverage: null, evaluations: allEvaluations.map(e => ({...e, evaluationDate: formatDateSafe(e.evaluationDate), tenantConfirmedAt: formatDateSafe(e.tenantConfirmedAt)})),
  };
  if (allEvaluations.length > 0) {
    const numEvals = allEvaluations.length;
    evalSummary.averagePunctuality = parseFloat((allEvaluations.reduce((sum, e) => sum + e.criteria.paymentPunctuality, 0) / numEvals).toFixed(1));
    evalSummary.averagePropertyCare = parseFloat((allEvaluations.reduce((sum, e) => sum + e.criteria.propertyCare, 0) / numEvals).toFixed(1));
    evalSummary.averageCommunication = parseFloat((allEvaluations.reduce((sum, e) => sum + e.criteria.communication, 0) / numEvals).toFixed(1));
    evalSummary.averageGeneralBehavior = parseFloat((allEvaluations.reduce((sum, e) => sum + e.criteria.generalBehavior, 0) / numEvals).toFixed(1));
    if(evalSummary.averagePunctuality && evalSummary.averagePropertyCare && evalSummary.averageCommunication && evalSummary.averageGeneralBehavior){
        evalSummary.overallAverage = parseFloat(((evalSummary.averagePunctuality + evalSummary.averagePropertyCare + evalSummary.averageCommunication + evalSummary.averageGeneralBehavior) / 4).toFixed(1));
    }
  }

  const acceptedPayments = allPayments.filter(p => p.status === "aceptado");
  const overduePayments = allPayments.filter(p => p.isOverdue === true);

  let paymentSummary: TenantPaymentsSummary = {
    totalPaymentsDeclared: allPayments.length,
    totalPaymentsAccepted: acceptedPayments.length,
    totalAmountAccepted: acceptedPayments.reduce((sum, p) => sum + p.amount, 0),
    compliancePercentage: allPayments.length > 0 ? parseFloat(((acceptedPayments.length / allPayments.length) * 100).toFixed(1)) : null,
    totalOverduePayments: overduePayments.length,
    overduePaymentsPercentage: allPayments.length > 0 ? parseFloat(((overduePayments.length / allPayments.length) * 100).toFixed(1)) : null,
  };

  let incidentSummary: TenantIncidentsSummary = {
    totalIncidentsInvolved: allIncidents.length,
    incidentsReportedByTenant: allIncidents.filter(i => i.createdBy === tenantUid).length,
    incidentsReceivedByTenant: allIncidents.filter(i => i.createdBy !== tenantUid && i.tenantId === tenantUid).length,
    incidentsResolved: allIncidents.filter(i => i.status === "cerrado").length,
  };
  
  const globalScore = evalSummary.overallAverage;

  return {
    tenantProfile: { ...tenantProfile, createdAt: formatDateSafe(tenantProfile.createdAt) },
    rentalHistory,
    evaluationsSummary: evalSummary,
    paymentsSummary: paymentSummary,
    incidentsSummary: incidentSummary,
    globalScore,
    generationDate: formatDateSafe(new Date()),
    certificateId: `SARA-CERT-${tenantUid.substring(0,5)}-${Date.now().toString().slice(-5)}`,
  };
}

export function TenantCertificateDisplay() {
  const { currentUser } = useAuth();
  const [certificateData, setCertificateData] = useState<TenantCertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role === 'Inquilino') {
      fetchTenantCertificateData(currentUser.uid)
        .then(data => {
          if (data) {
            setCertificateData(data);
          } else {
            setError("No se pudieron cargar los datos del certificado. Verifica que tu perfil esté completo.");
          }
        })
        .catch(err => {
          console.error("Error fetching certificate data:", err);
          setError("Ocurrió un error al generar el certificado.");
        })
        .finally(() => setIsLoading(false));
    } else if (currentUser && currentUser.role !== 'Inquilino') {
        setError("Esta función solo está disponible para inquilinos.");
        setIsLoading(false);
    } else if (!currentUser) {
        setError("Debes iniciar sesión para generar tu certificado.");
        setIsLoading(false);
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Generando tu certificado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error al generar certificado</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!certificateData) {
    return <p className="py-10 text-center text-muted-foreground">No hay datos disponibles para generar el certificado.</p>;
  }

  const { 
    tenantProfile, rentalHistory, evaluationsSummary, paymentsSummary, incidentsSummary, 
    globalScore, generationDate, certificateId 
  } = certificateData;

  const renderStars = (score: number | null, maxStars = 5) => {
    if (score === null || isNaN(score)) return <span className="text-muted-foreground">N/A</span>;
    const fullStars = Math.floor(score);
    const halfStar = score % 1 >= 0.5 ? 1 : 0; // Simplified: no half stars, just round
    const emptyStars = maxStars - fullStars - halfStar;
    return (
      <span className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
        {/* Add half star logic if desired */}
        {Array(emptyStars).fill(0).map((_, i) => <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />)}
        <span className="ml-2 text-sm font-medium">({score.toFixed(1)}/{maxStars})</span>
      </span>
    );
  };
  
  return (
    <div className="bg-white p-6 md:p-10 rounded-lg shadow-xl mt-6 printable-certificate">
      {/* Header */}
      <header className="flex flex-col items-center justify-between border-b-2 border-primary pb-6 mb-8 sm:flex-row">
        <div className='text-center sm:text-left'>
          <h1 className="text-3xl font-bold text-primary font-headline">Certificado de Comportamiento</h1>
          <p className="text-lg text-muted-foreground">S.A.R.A - Sistema de Administración Responsable de Arriendos</p>
        </div>
        <Image src="https://placehold.co/120x120.png?text=SARA+Logo" alt="S.A.R.A Logo" width={100} height={100} className="mt-4 sm:mt-0" data-ai-hint="company logo building key" />
      </header>

      {/* Certificate Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
        <p><strong>Fecha de Emisión:</strong> {generationDate}</p>
        <p><strong>ID del Certificado:</strong> <span className="font-mono">{certificateId}</span></p>
      </div>

      {/* Tenant Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-3 border-b pb-2">Datos del Inquilino</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <p><strong>Nombre Completo:</strong> {tenantProfile.displayName || 'N/A'}</p>
          <p><strong>Correo Electrónico:</strong> {tenantProfile.email || 'N/A'}</p>
          <p><strong>Miembro S.A.R.A desde:</strong> {tenantProfile.createdAt || 'N/A'}</p>
        </div>
      </section>

      {/* Rental History */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-3 border-b pb-2">Historial de Arriendos</h2>
        {rentalHistory.length > 0 ? (
          <div className="space-y-4">
            {rentalHistory.map((item, index) => (
              <div key={index} className="p-3 border rounded-md bg-muted/30 text-sm">
                <p><strong>Propiedad:</strong> {item.propertyAddress}</p>
                <p><strong>Periodo:</strong> {item.startDate} - {item.endDate}</p>
                <p><strong>Arrendador:</strong> {item.landlordName}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No hay historial de arriendos disponible.</p>}
      </section>

      {/* Evaluations Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-3 border-b pb-2">Resumen de Evaluaciones</h2>
        {evaluationsSummary.evaluations.length > 0 && evaluationsSummary.overallAverage !== null ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <p><strong>Puntualidad en Pagos:</strong> {renderStars(evaluationsSummary.averagePunctuality)}</p>
              <p><strong>Cuidado de la Propiedad:</strong> {renderStars(evaluationsSummary.averagePropertyCare)}</p>
              <p><strong>Comunicación:</strong> {renderStars(evaluationsSummary.averageCommunication)}</p>
              <p><strong>Convivencia General:</strong> {renderStars(evaluationsSummary.averageGeneralBehavior)}</p>
            </div>
             <div className="mt-4 pt-3 border-t">
                <p className="text-md font-semibold">Promedio General de Evaluaciones:</p>
                {renderStars(evaluationsSummary.overallAverage)}
            </div>
            {evaluationsSummary.evaluations.some(e => e.tenantComment) && (
              <div className="mt-3">
                <h3 className="font-medium text-sm mb-1">Comentarios Destacados del Inquilino:</h3>
                {evaluationsSummary.evaluations.filter(e=>e.tenantComment).slice(0,2).map((e,i) => (
                  <blockquote key={i} className="text-xs border-l-2 pl-2 italic text-muted-foreground mb-1">"{e.tenantComment}" <span className="text-primary/80">- Respecto a Propiedad {e.propertyName}</span></blockquote>
                ))}
              </div>
            )}
          </div>
        ) : <p className="text-sm text-muted-foreground">No hay evaluaciones disponibles.</p>}
      </section>
      
      {/* Payments Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-3 border-b pb-2">Resumen de Pagos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <p><strong>Pagos Declarados:</strong> {paymentsSummary.totalPaymentsDeclared}</p>
            <p><strong>Pagos Aceptados:</strong> {paymentsSummary.totalPaymentsAccepted}</p>
            <p><strong>Monto Total Aceptado:</strong> ${paymentsSummary.totalAmountAccepted.toLocaleString('es-CL')}</p>
            <p><strong>Cumplimiento de Declaraciones:</strong> {paymentsSummary.compliancePercentage !== null ? `${paymentsSummary.compliancePercentage.toFixed(1)}%` : 'N/A'}</p>
            <p><strong>Pagos Declarados con Atraso:</strong> {paymentsSummary.totalOverduePayments} 
              {paymentsSummary.overduePaymentsPercentage !== null && paymentsSummary.totalOverduePayments > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  <AlertOctagon className="h-3 w-3 mr-1" />
                  {paymentsSummary.overduePaymentsPercentage.toFixed(1)}% de los pagos
                </Badge>
              )}
            </p>
        </div>
      </section>

      {/* Incidents Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-primary mb-3 border-b pb-2">Resumen de Incidentes</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <p><strong>Incidentes Totales Involucrado:</strong> {incidentsSummary.totalIncidentsInvolved}</p>
            <p><strong>Incidentes Reportados por Inquilino:</strong> {incidentsSummary.incidentsReportedByTenant}</p>
            <p><strong>Incidentes Recibidos por Inquilino:</strong> {incidentsSummary.incidentsReceivedByTenant}</p>
            <p><strong>Incidentes Resueltos:</strong> {incidentsSummary.incidentsResolved}</p>
        </div>
      </section>

      {/* Global Score & QR Code */}
      <section className="mb-8 pt-6 border-t-2 border-primary">
         <div className="flex flex-col items-center sm:flex-row justify-between gap-6">
            <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold text-primary mb-2">Puntuación Global del Inquilino</h2>
                {globalScore !== null ? (
                    <div className="flex items-center justify-center sm:justify-start">
                        {renderStars(globalScore, 5)}
                        <span className="text-3xl font-bold text-primary ml-3">{globalScore.toFixed(1)} <span className="text-lg">/ 5.0</span></span>
                    </div>
                ) : (
                    <p className="text-lg text-muted-foreground">Puntuación global no disponible.</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Basado en el promedio de evaluaciones recibidas.</p>
            </div>
            <div className="flex flex-col items-center">
                 <Image src="https://placehold.co/100x100.png?text=QR+Code" alt="QR Code de Verificación" width={100} height={100} data-ai-hint="qr code verification" />
                 <p className="text-xs text-muted-foreground mt-1">Escanear para verificar (simulado)</p>
            </div>
        </div>
      </section>

      {/* Footer / Disclaimer */}
      <footer className="mt-12 pt-6 border-t text-center">
        <p className="text-xs text-muted-foreground">
          Este certificado es generado automáticamente por S.A.R.A y se basa en la información registrada en la plataforma hasta la fecha de emisión.
          S.A.R.A no se hace responsable por la veracidad de la información ingresada por los usuarios.
        </p>
        <p className="text-xs text-primary mt-1">contacto@sara-app.com | www.sara-app.com (Sitio ficticio)</p>
      </footer>
      
      {/* Print button - visible on screen, hidden on print */}
       <div className="mt-8 text-center print:hidden">
        <Button onClick={() => window.print()} size="lg">
          <Printer className="mr-2 h-5 w-5" /> Imprimir / Guardar como PDF
        </Button>
      </div>

      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .printable-certificate { margin: 0; padding: 20px; border: none; box-shadow: none; }
          .print\:hidden { display: none !important; }
          /* Add any other print-specific styles here */
        }
      `}</style>
    </div>
  );
}

