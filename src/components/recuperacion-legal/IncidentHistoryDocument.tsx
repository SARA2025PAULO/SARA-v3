
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Contract, Incident, UserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, MessageSquare, CheckCircle2, Paperclip, UserCircle } from "lucide-react";

interface IncidentHistoryDocumentProps {
  contract: Contract;
}

export function IncidentHistoryDocument({ contract }: IncidentHistoryDocumentProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfilesCache, setUserProfilesCache] = useState<Record<string, UserProfile>>({});

  const fetchUserDetails = useCallback(async (userId: string) => {
    if (!userId || !db) return undefined;
    if (userProfilesCache[userId]) return userProfilesCache[userId];

    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        setUserProfilesCache(prev => ({ ...prev, [userId]: userProfile }));
        return userProfile;
      }
    } catch (error) {
      console.error(`Error fetching user details for ${userId}:`, error);
    }
    return undefined;
  }, [userProfilesCache]);


  const fetchIncidents = useCallback(async () => {
    if (!contract || !db) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const incidentsCollectionRef = collection(db, "incidents");
      const q = query(incidentsCollectionRef, where("contractId", "==", contract.id), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedIncidents = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data() as Omit<Incident, 'id'>;
        
        // Fetch user details if names are not present
        let landlordProfile = data.landlordId ? await fetchUserDetails(data.landlordId) : undefined;
        let tenantProfile = data.tenantId ? await fetchUserDetails(data.tenantId) : undefined;

        return {
          id: docSnap.id,
          ...data,
          landlordName: data.landlordName || landlordProfile?.displayName || data.landlordId,
          tenantName: data.tenantName || tenantProfile?.displayName || data.tenantId,
          createdAt: data.createdAt, // Keep as is, will be formatted
          respondedAt: data.respondedAt,
          closedAt: data.closedAt,
        } as Incident;
      }));
      setIncidents(fetchedIncidents);
    } catch (error) {
      console.error("Error fetching incidents for document:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contract, fetchUserDetails]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Fecha Inválida';
    }
  };
  
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
     try {
        return new Date(dateString).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
        return 'Fecha Inválida';
    }
  };

  const getStatusBadgeVariant = (status: Incident["status"]) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "respondido": return "bg-blue-100 text-blue-800 border-blue-300";
      case "cerrado": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  const getUserDisplayName = (incident: Incident, userIdField: 'createdBy' | 'respondedBy' | 'closedBy') => {
    const userId = incident[userIdField];
    if (!userId) return 'Sistema'; // Or some default
    if (userId === incident.landlordId) return incident.landlordName || `Arrendador (${userId.substring(0,5)})`;
    if (userId === incident.tenantId) return incident.tenantName || `Inquilino (${userId.substring(0,5)})`;
    return userProfilesCache[userId]?.displayName || `Usuario (${userId.substring(0,5)})`;
  };


  if (isLoading) {
    return <div className="p-6 text-center border rounded-md bg-background shadow mt-4 print:shadow-none print:border-none"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> <p className="mt-2 text-muted-foreground">Cargando historial de incidentes...</p></div>;
  }

  return (
    <div className="p-6 border rounded-md bg-background shadow mt-4 print:shadow-none print:border-none">
      <header className="text-center mb-8 print:mb-6">
        <h2 className="text-2xl font-bold text-primary font-headline">HISTORIAL DE INCIDENTES</h2>
        <p className="text-md text-muted-foreground mt-1">Contrato de Arriendo Propiedad: <span className="font-semibold">{contract.propertyName}</span></p>
        <p className="text-sm text-muted-foreground">Arrendador: {contract.landlordName || contract.landlordId}</p>
        <p className="text-sm text-muted-foreground">Inquilino: {contract.tenantName || contract.tenantEmail}</p>
        <p className="text-xs text-muted-foreground mt-2">Emitido el: {new Date().toLocaleDateString("es-CL", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section>
        <h3 className="text-lg font-semibold mb-3 border-b pb-1 text-primary/90">Detalle de Incidentes Registrados</h3>
        {incidents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay incidentes registrados para este contrato.</p>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="p-4 border rounded-md bg-muted/50 print:border-gray-300">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-md font-semibold capitalize flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-destructive/80"/>
                    Tipo: {incident.type}
                  </h4>
                  <Badge variant="outline" className={`${getStatusBadgeVariant(incident.status)} capitalize text-xs`}>
                    {incident.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1"><strong>ID Incidente:</strong> {incident.id}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Creado:</strong> {formatDateTime(incident.createdAt)} por {getUserDisplayName(incident, 'createdBy')}
                </p>
                <p className="text-sm mb-1"><strong>Descripción Inicial:</strong></p>
                <p className="text-sm whitespace-pre-wrap p-2 bg-background rounded text-muted-foreground max-h-28 overflow-y-auto">{incident.description}</p>
                {incident.initialAttachmentUrl && (
                    <p className="text-xs mt-1 flex items-center"><Paperclip className="h-3 w-3 mr-1"/> Adjunto Creador: {incident.initialAttachmentUrl}</p>
                )}

                {incident.responseText && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-sm mb-1"><strong>Respuesta:</strong> (Por {getUserDisplayName(incident, 'respondedBy')} el {formatDateTime(incident.respondedAt)})</p>
                        <p className="text-sm whitespace-pre-wrap p-2 bg-background rounded text-muted-foreground max-h-28 overflow-y-auto">{incident.responseText}</p>
                        {incident.responseAttachmentUrl && (
                            <p className="text-xs mt-1 flex items-center"><Paperclip className="h-3 w-3 mr-1"/> Adjunto Respuesta: {incident.responseAttachmentUrl}</p>
                        )}
                    </div>
                )}
                 {incident.status === "cerrado" && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-sm font-medium flex items-center text-green-700">
                            <CheckCircle2 className="h-4 w-4 mr-2"/>
                            Cerrado por {getUserDisplayName(incident, 'closedBy')} el {formatDateTime(incident.closedAt)}
                        </p>
                    </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <footer className="mt-12 pt-6 border-t text-center print:mt-8 print:pt-4">
        <p className="text-xs text-muted-foreground">
          Este historial se basa en los incidentes registrados en la plataforma S.A.R.A para el contrato ID: {contract.id}.
        </p>
      </footer>
    </div>
  );
}

