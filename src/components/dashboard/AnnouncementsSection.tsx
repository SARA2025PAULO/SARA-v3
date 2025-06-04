
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import type { Contract, Incident, Evaluation, UserProfile } from '@/types';
import { collection, query, where, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, AlertTriangle, CheckCircle2, MessageSquareWarning, CalendarClock, FileSignature, Info } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO, setDate, getDate, getMonth, getYear, addMonths, isBefore, isSameDay } from 'date-fns';

interface Announcement {
  id: string;
  message: string;
  link?: string;
  icon: React.ElementType;
  type: 'info' | 'warning' | 'success' | 'error';
  date: Date; // For sorting
}

interface AnnouncementsSectionProps {
  // Props can be added if needed, e.g. for specific styling or limits
}

// Helper to safely convert Firestore Timestamp or ISO string to Date object
const safeGetDate = (firestoreTimestampOrISOString: any, fallbackDate: Date): Date => {
  if (!firestoreTimestampOrISOString) {
    return fallbackDate;
  }
  // Check if it's a Firestore Timestamp
  if (firestoreTimestampOrISOString.toDate && typeof firestoreTimestampOrISOString.toDate === 'function') {
    return firestoreTimestampOrISOString.toDate();
  }
  // Check if it's an ISO string
  if (typeof firestoreTimestampOrISOString === 'string') {
    try {
      const parsedDate = parseISO(firestoreTimestampOrISOString);
      if (!isNaN(parsedDate.getTime())) { // Check if date is valid
        return parsedDate;
      }
    } catch (e) {
      console.warn("Failed to parse date string for announcement:", firestoreTimestampOrISOString, e);
    }
  }
  // If it's already a JS Date object
  if (firestoreTimestampOrISOString instanceof Date && !isNaN(firestoreTimestampOrISOString.getTime())) {
      return firestoreTimestampOrISOString;
  }
  console.warn("Unparseable date encountered for announcement, using fallback:", firestoreTimestampOrISOString);
  return fallbackDate;
};


export function AnnouncementsSection({}: AnnouncementsSectionProps) {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentUser || !db) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const newAnnouncements: Announcement[] = [];
    const now = new Date();

    try {
      if (currentUser.role === "Inquilino") {
        // 1. Nueva evaluación recibida
        const evalsQuery = query(collection(db, "evaluations"), where("tenantId", "==", currentUser.uid), where("status", "==", "pendiente de confirmacion"));
        const evalsSnapshot = await getDocs(evalsQuery);
        evalsSnapshot.forEach(doc => {
          const evalData = doc.data();
          newAnnouncements.push({
            id: `eval-${doc.id}`,
            message: "Has recibido una nueva evaluación. Revísala y deja tu comentario.",
            link: "/evaluaciones",
            icon: AlertTriangle,
            type: "warning",
            date: safeGetDate(evalData.evaluationDate, now),
          });
        });

        // 2. Incidente pendiente de respuesta
        const incidentsQuery = query(collection(db, "incidents"), where("tenantId", "==", currentUser.uid), where("status", "==", "pendiente"), where("createdBy", "!=", currentUser.uid));
        const incidentsSnapshot = await getDocs(incidentsQuery);
        incidentsSnapshot.forEach(doc => {
          const incidentData = doc.data();
          newAnnouncements.push({
            id: `incident-resp-${doc.id}`,
            message: "Tienes un incidente pendiente de respuesta.",
            link: "/incidentes",
            icon: MessageSquareWarning,
            type: "warning",
            date: safeGetDate(incidentData.createdAt, now),
          });
        });

        // 3. Contrato pendiente de aprobación/firma
        const pendingContractsQuery = query(collection(db, "contracts"), where("tenantId", "==", currentUser.uid), where("status", "==", "Pendiente"));
        const pendingContractsSnapshot = await getDocs(pendingContractsQuery);
        pendingContractsSnapshot.forEach(doc => {
          const contractData = doc.data();
          newAnnouncements.push({
            id: `contract-sign-${doc.id}`,
            message: `Tienes un contrato para la propiedad "${contractData.propertyName}" pendiente de aprobación.`,
            link: "/contratos",
            icon: FileSignature,
            type: "info",
            date: safeGetDate(contractData.createdAt, now),
          });
        });
        
        // 4. Aviso de pago próximo
        const activeContractsQuery = query(collection(db, "contracts"), where("tenantId", "==", currentUser.uid), where("status", "==", "Activo"));
        const activeContractsSnapshot = await getDocs(activeContractsQuery);
        activeContractsSnapshot.forEach(docSnap => { // Changed doc to docSnap to avoid conflict
            const contract = docSnap.data() as Contract; // Keep type assertion for other fields
            if (contract.paymentDay) {
                let paymentDateThisMonth = setDate(now, contract.paymentDay);
                if (isBefore(paymentDateThisMonth, now) && !isSameDay(paymentDateThisMonth, now)) {
                    paymentDateThisMonth = addMonths(paymentDateThisMonth, 1);
                }
                const daysUntilPayment = differenceInDays(paymentDateThisMonth, now);
                if (daysUntilPayment >= 0 && daysUntilPayment <= 7) {
                    newAnnouncements.push({
                        id: `payment-due-${docSnap.id}`,
                        message: `Recuerda: el pago del arriendo de "${contract.propertyName}" vence en ${daysUntilPayment === 0 ? 'hoy' : `${daysUntilPayment} día(s)`}.`,
                        link: "/pagos",
                        icon: CalendarClock,
                        type: "info",
                        date: paymentDateThisMonth, // This is already a JS Date
                    });
                }
            }
        });


      } else if (currentUser.role === "Arrendador") {
        // 1. Respuesta a incidente recibida
        const respondedIncidentsQuery = query(
          collection(db, "incidents"), 
          where("landlordId", "==", currentUser.uid), 
          where("status", "==", "respondido"),
          where("createdBy", "==", currentUser.uid) 
        );
        const respondedIncidentsSnapshot = await getDocs(respondedIncidentsQuery);
        respondedIncidentsSnapshot.forEach(doc => {
          const incidentData = doc.data();
          newAnnouncements.push({
            id: `incident-landlord-resp-${doc.id}`,
            message: `El inquilino ${incidentData.tenantName || 'N/A'} ha respondido al incidente sobre "${incidentData.propertyName}".`,
            link: "/incidentes",
            icon: MessageSquareWarning,
            type: "info",
            date: safeGetDate(incidentData.respondedAt, now),
          });
        });

        // 2. Evaluación sin confirmar por inquilino
        const unconfirmedEvalsQuery = query(collection(db, "evaluations"), where("landlordId", "==", currentUser.uid), where("status", "==", "pendiente de confirmacion"));
        const unconfirmedEvalsSnapshot = await getDocs(unconfirmedEvalsQuery);
        unconfirmedEvalsSnapshot.forEach(doc => {
          const evalData = doc.data();
          newAnnouncements.push({
            id: `eval-unconf-${doc.id}`,
            message: `El inquilino ${evalData.tenantName || 'N/A'} aún no ha confirmado la recepción de la evaluación para "${evalData.propertyName}".`,
            link: "/evaluaciones",
            icon: AlertTriangle,
            type: "info",
            date: safeGetDate(evalData.evaluationDate, now),
          });
        });

        // 3. Contrato sin firmar por el inquilino
        const pendingTenantContractsQuery = query(collection(db, "contracts"), where("landlordId", "==", currentUser.uid), where("status", "==", "Pendiente"));
        const pendingTenantContractsSnapshot = await getDocs(pendingTenantContractsQuery);
        pendingTenantContractsSnapshot.forEach(doc => {
          const contractData = doc.data();
          newAnnouncements.push({
            id: `contract-tenant-sign-${doc.id}`,
            message: `El contrato para "${contractData.propertyName}" con ${contractData.tenantName || contractData.tenantEmail} aún no ha sido aprobado por el inquilino.`,
            link: "/contratos",
            icon: FileSignature,
            type: "warning",
            date: safeGetDate(contractData.createdAt, now),
          });
        });
      }
      
      newAnnouncements.sort((a, b) => b.date.getTime() - a.date.getTime());
      setAnnouncements(newAnnouncements);

    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const getIconColor = (type: Announcement['type']) => {
    switch (type) {
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-destructive';
      case 'success': return 'text-green-500';
      case 'info':
      default: return 'text-primary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellRing className="mr-2 h-5 w-5 text-primary" /> Anuncios Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando anuncios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BellRing className="mr-2 h-5 w-5 text-primary" /> Anuncios Importantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <Info className="mx-auto h-10 w-10 mb-3" />
            <p>No hay anuncios importantes por ahora.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
            {announcements.map((ann) => (
              <div key={ann.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md border border-border hover:shadow-sm transition-shadow">
                <ann.icon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${getIconColor(ann.type)}`} />
                <div className="flex-grow">
                  <p className="text-sm">{ann.message}</p>
                  {ann.link && (
                    <Link href={ann.link} legacyBehavior>
                      <a className="text-xs text-primary hover:underline">Ver detalles</a>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
