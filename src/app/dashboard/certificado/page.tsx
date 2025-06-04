
// This will be a server component to fetch all necessary data
import { TenantCertificateDisplay } from "@/components/certificado/TenantCertificateDisplay";
import { auth, db } from "@/lib/firebase";
import { UserProfile, TenantCertificateData, Contract, Property, Evaluation, Payment, Incident, TenantRentalHistory, TenantEvaluationsSummary, TenantPaymentsSummary, TenantIncidentsSummary } from "@/types";
import { collection, doc, getDoc, getDocs, query, where, orderBy, collectionGroup } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { User } from "firebase/auth";
import { AppLayout } from "@/components/layout/AppLayout"; // Assuming AppLayout can be used here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function getTenantCertificateData(tenantUid: string): Promise<TenantCertificateData | null> {
  if (!db) return null;

  const tenantDocRef = doc(db, "users", tenantUid);
  const tenantDocSnap = await getDoc(tenantDocRef);

  if (!tenantDocSnap.exists() || tenantDocSnap.data()?.role !== 'Inquilino') {
    console.error("Tenant profile not found or role is not Inquilino.");
    return null;
  }
  const tenantProfile = { id: tenantDocSnap.id, ...tenantDocSnap.data() } as UserProfile;
  
  // Simulate user registration date from profile if available, otherwise use current date
  const registrationDate = tenantProfile.createdAt ? new Date(tenantProfile.createdAt).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL');

  const contractsQuery = query(collection(db, "contracts"), where("tenantId", "==", tenantUid), orderBy("startDate", "desc"));
  const contractsSnapshot = await getDocs(contractsQuery);
  const contracts: Contract[] = contractsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));

  const rentalHistory: TenantRentalHistory[] = [];
  let allEvaluations: Evaluation[] = [];
  let allPayments: Payment[] = [];
  let allIncidents: Incident[] = [];

  for (const contract of contracts) {
    // Landlord Name
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
      startDate: new Date(contract.startDate).toLocaleDateString('es-CL'),
      endDate: new Date(contract.endDate).toLocaleDateJString('es-CL'),
      landlordName: landlordName,
    });

    const evaluationsQuery = query(collection(db, "evaluations"), where("contractId", "==", contract.id), where("tenantId", "==", tenantUid));
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    evaluationsSnapshot.docs.forEach(doc => allEvaluations.push({ id: doc.id, ...doc.data() } as Evaluation));

    const paymentsQuery = query(collection(db, "contracts", contract.id, "payments"), where("tenantId", "==", tenantUid));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    paymentsSnapshot.docs.forEach(doc => allPayments.push({ id: doc.id, ...doc.data()} as Payment));
    
    const incidentsQuery = query(collection(db, "incidents"), where("contractId", "==", contract.id), 
      (q) => q.where("tenantId", "==", tenantUid).or(q.where("createdBy", "==", tenantUid))); // Simplified, check if it works with OR
    const incidentsSnapshot = await getDocs(incidentsQuery); // This might require compound index or separate queries
    // For simplicity, let's query incidents where tenantId is involved or createdBy tenantId separately if OR is an issue
    const incidentsTenantQuery = query(collection(db, "incidents"), where("contractId", "==", contract.id), where("tenantId", "==", tenantUid));
    const incidentsTenantSnapshot = await getDocs(incidentsTenantQuery);
    incidentsTenantSnapshot.docs.forEach(doc => {
        if(!allIncidents.find(i => i.id === doc.id)) allIncidents.push({ id: doc.id, ...doc.data()} as Incident);
    });
    const incidentsCreatedByTenantQuery = query(collection(db, "incidents"), where("contractId", "==", contract.id), where("createdBy", "==", tenantUid));
    const incidentsCreatedByTenantSnapshot = await getDocs(incidentsCreatedByTenantQuery);
    incidentsCreatedByTenantSnapshot.docs.forEach(doc => {
        if(!allIncidents.find(i => i.id === doc.id)) allIncidents.push({ id: doc.id, ...doc.data()} as Incident);
    });
  }
  
  // Calculate Evaluations Summary
  let evalSummary: TenantEvaluationsSummary = {
    averagePunctuality: null, averagePropertyCare: null, averageCommunication: null, averageGeneralBehavior: null,
    overallAverage: null, evaluations: allEvaluations,
  };
  if (allEvaluations.length > 0) {
    evalSummary.averagePunctuality = allEvaluations.reduce((sum, e) => sum + e.criteria.paymentPunctuality, 0) / allEvaluations.length;
    evalSummary.averagePropertyCare = allEvaluations.reduce((sum, e) => sum + e.criteria.propertyCare, 0) / allEvaluations.length;
    evalSummary.averageCommunication = allEvaluations.reduce((sum, e) => sum + e.criteria.communication, 0) / allEvaluations.length;
    evalSummary.averageGeneralBehavior = allEvaluations.reduce((sum, e) => sum + e.criteria.generalBehavior, 0) / allEvaluations.length;
    evalSummary.overallAverage = (evalSummary.averagePunctuality + evalSummary.averagePropertyCare + evalSummary.averageCommunication + evalSummary.averageGeneralBehavior) / 4;
  }

  // Calculate Payments Summary
  const acceptedPayments = allPayments.filter(p => p.status === "aceptado");
  let paymentSummary: TenantPaymentsSummary = {
    totalPaymentsDeclared: allPayments.length,
    totalPaymentsAccepted: acceptedPayments.length,
    totalAmountAccepted: acceptedPayments.reduce((sum, p) => sum + p.amount, 0),
    compliancePercentage: allPayments.length > 0 ? (acceptedPayments.length / allPayments.length) * 100 : null,
  };

  // Calculate Incidents Summary
  let incidentSummary: TenantIncidentsSummary = {
    totalIncidentsInvolved: allIncidents.length,
    incidentsReportedByTenant: allIncidents.filter(i => i.createdBy === tenantUid).length,
    incidentsReceivedByTenant: allIncidents.filter(i => i.createdBy !== tenantUid && i.tenantId === tenantUid).length, // Simplified
    incidentsResolved: allIncidents.filter(i => i.status === "cerrado").length,
  };
  
  // Calculate Global Score (simple average of evaluation overall average for now)
  const globalScore = evalSummary.overallAverage ? parseFloat(evalSummary.overallAverage.toFixed(1)) : null;

  return {
    tenantProfile: { ...tenantProfile, createdAt: registrationDate },
    rentalHistory,
    evaluationsSummary: evalSummary,
    paymentsSummary: paymentSummary,
    incidentsSummary: incidentSummary,
    globalScore,
    generationDate: new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }),
    certificateId: `SARA-CERT-${tenantUid.substring(0,5)}-${Date.now().toString().slice(-5)}`,
  };
}


export default async function CertificadoPage() {
  // This is a server component. We need to get the current user's UID.
  // In a real app, you'd get this from a session or server-side auth context.
  // For Firebase Studio, `auth.currentUser` might be null on the server.
  // We'll assume we can get it, or redirect. This part is tricky without a full auth server context.
  // Let's simulate getting the user's UID. For a real app, protect this route.
  
  // Placeholder for user UID - THIS NEEDS A ROBUST SERVER-SIDE SOLUTION FOR AUTH
  // For now, we cannot directly access `auth.currentUser` in a Server Component in this manner.
  // This page should ideally be protected and receive user context from middleware or similar.
  // As a temporary measure for prototyping, we'll skip direct auth check here and rely on AppLayout.
  // If this were a full app, we'd use next-auth or Firebase Admin SDK for server-side session.

  // const currentUser = auth.currentUser; // This won't work reliably on server for client-side auth SDK
  // const tenantUid = currentUser?.uid; // Placeholder

  // Since direct auth on server components is complex with client-side SDK,
  // we'll present a message if data cannot be fetched or rely on client redirect from AppLayout
  // For the purpose of this prototype, let's assume we pass a tenantId or make it client-side for data fetching.
  // To make it work as a Server Component for data fetching, we'd need a server-side auth strategy.
  // For now, this page will try to fetch, but will show a "loading/error" state.
  // A better approach for a full app might be an API route that page.tsx (client) calls.

  // For the sake of showing the component, let's conditionally render
  // The actual data fetching based on a real authenticated user needs to be handled
  // by client-side useEffect or a proper server-side auth session.
  // This is a limitation of trying to use client-side Firebase Auth directly in Next.js Server Components.

  // Let's pivot to a client-side data fetching approach for the certificate data
  // to make it work with the existing AuthContext.
  // So, this page.tsx will be a client component that uses AuthContext.
  
  // --- CONTENT BELOW WILL BE REPLACED BY CLIENT-SIDE IMPLEMENTATION ---
  // const certificateData = tenantUid ? await getTenantCertificateData(tenantUid) : null;

  // The above server-side fetching won't work well with client-side Firebase Auth.
  // We'll adjust this to be client-rendered or fetch data via an API route/server action if auth is available.
  // For now, this page will be a client component within AppLayout.
  // The actual data fetching will be done in a client component, perhaps CertificadoPageContent.

  return (
    <AppLayout>
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Certificado de Comportamiento del Inquilino</CardTitle>
                    <CardDescription>
                        Este es un resumen de tu historial en S.A.R.A. Puedes usar el botón "Imprimir" de tu navegador para guardarlo como PDF.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="my-4">Cargando datos del certificado... Por favor, asegúrate de haber iniciado sesión.</p>
                    <p className="text-sm text-muted-foreground">
                        Nota: La obtención de datos para el certificado se realizará del lado del cliente debido a la
                        configuración actual. En una aplicación completa, esto se manejaría de forma más robusta.
                    </p>
                    <div className="mt-6 flex items-center space-x-4">
                        <Link href="/dashboard">
                            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel</Button>
                        </Link>
                        <Button onClick={() => typeof window !== "undefined" && window.print()} disabled>
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Certificado (Cargando...)
                        </Button>
                    </div>
                     {/* The TenantCertificateDisplay component will be rendered client-side */}
                     {/* It will fetch its own data using the current user's context */}
                     <TenantCertificateDisplay />
                </CardContent>
            </Card>
        </div>
    </AppLayout>
  );
}
