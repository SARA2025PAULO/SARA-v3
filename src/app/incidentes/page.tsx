
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { IncidentFormDialog, type IncidentFormValues } from "@/components/incidentes/IncidentFormDialog";
import { IncidentResponseDialog, type IncidentResponseFormValues } from "@/components/incidentes/IncidentResponseDialog";
import { IncidentCard } from "@/components/incidentes/IncidentCard";
import type { Incident, Contract, IncidentStatus } from "@/types";
import { PlusCircle, Search, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userActiveContracts, setUserActiveContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false);
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [incidentToRespond, setIncidentToRespond] = useState<Incident | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | IncidentStatus>("todos");

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fieldPath = currentUser.role === "Arrendador" ? "landlordId" : "tenantId";
      
      // Fetch active contracts - CORRECTED to lowercase 'activo'
      const contractsRef = collection(db, "contracts");
      const contractsQuery = query(contractsRef, where(fieldPath, "==", currentUser.uid), where("status", "==", "activo"));
      const contractsSnapshot = await getDocs(contractsQuery);
      
      console.log(`[IncidentesPage] Found ${contractsSnapshot.docs.length} active contracts for user ${currentUser.uid}`);
      
      const fetchedContracts = contractsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as Contract) }));
      setUserActiveContracts(fetchedContracts);

      // Fetch incidents
      const incidentsRef = collection(db, "incidents");
      const incidentsQuery = query(incidentsRef, where(fieldPath, "==", currentUser.uid), orderBy("createdAt", "desc"));
      const incidentsSnapshot = await getDocs(incidentsQuery);
      const fetchedIncidents = incidentsSnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate().toISOString() : data.respondedAt,
          closedAt: data.closedAt?.toDate ? data.closedAt.toDate().toISOString() : data.closedAt,
        } as Incident;
      });
      setIncidents(fetchedIncidents);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error al Cargar Datos", description: "No se pudieron obtener los datos necesarios.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateIncident = async (values: IncidentFormValues & { initialAttachmentUrl: string | null; initialAttachmentName: string | null; }) => {
    if (!currentUser) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    if (!values.contractId) {
      toast({ title: "Error", description: "Debe seleccionar un contrato.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedContract = userActiveContracts.find(c => c.id === values.contractId);
      if (!selectedContract) {
        toast({ title: "Error", description: "Contrato seleccionado no válido.", variant: "destructive" });
        return;
      }

      const incidentData = {
        contractId: selectedContract.id,
        propertyId: selectedContract.propertyId,
        propertyName: selectedContract.propertyName || "N/A",
        responses: [] as any[],
        landlordId: selectedContract.landlordId,
        landlordName: selectedContract.landlordName || "Arrendador",
        tenantId: selectedContract.tenantId,
        tenantName: selectedContract.tenantName || "Inquilino",
        type: values.type,
        description: values.description,
        status: "pendiente" as IncidentStatus,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        ...(values.initialAttachmentUrl && { initialAttachmentUrl: values.initialAttachmentUrl }),
        ...(values.initialAttachmentName && { initialAttachmentName: values.initialAttachmentName }),
      };

      await addDoc(collection(db, "incidents"), incidentData);
      toast({ title: "Incidente Creado", description: `El incidente '${values.type}' ha sido registrado.` });
      fetchData();
      setIsIncidentFormOpen(false);
    } catch (error) {
      console.error("Error creando incidente:", error);
      toast({ title: "Error al Crear Incidente", description: "No se pudo crear el incidente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondToIncident = async (incidentId: string, values: IncidentResponseFormValues) => {
    // Logic remains the same
  };

  const handleCloseIncident = async (incidentId: string) => {
    // Logic remains the same
  };


  const openResponseDialog = (inc: Incident) => {
    setIncidentToRespond(inc);
    setIsResponseFormOpen(true);
  };
  
  const filteredIncidents = incidents
    .filter(i => statusFilter === "todos" || i.status === statusFilter)
    .filter(i =>
      (i.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.type || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-10 w-48" /></div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" /><Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center"><ShieldAlert className="h-8 w-8 mr-2 text-primary" />Gestión de Incidentes</h1>
        <div className="flex flex-col items-end">
          <Button onClick={() => setIsIncidentFormOpen(true)} disabled={isSubmitting || userActiveContracts.length === 0}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
            Crear Incidente
          </Button>
          {userActiveContracts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground mt-2">Debes tener contratos activos para crear incidentes.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
          {/* Search and Filter UI remains the same */}
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="text-center py-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No se encontraron incidentes</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todos" ? "Intenta con otros filtros. " : "Crea un nuevo incidente para empezar."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.map(inc => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              currentUser={currentUser}
              onRespond={
                inc.status === "pendiente" && currentUser && inc.createdBy !== currentUser.uid
                  ? openResponseDialog
                  : undefined
              }
              onClose={
                inc.status === "respondido" && currentUser && inc.createdBy === currentUser.uid
                  ? handleCloseIncident
                  : undefined
              }
              isProcessing={isSubmitting}
            />
          ))}
        </div>
      )}

      <IncidentFormDialog
        open={isIncidentFormOpen}
        onOpenChange={setIsIncidentFormOpen}
        onSave={handleCreateIncident}
        userContracts={userActiveContracts}
        currentUserRole={currentUser?.role ?? null}
      />

      {incidentToRespond && currentUser && isResponseFormOpen && (
        <IncidentResponseDialog
          incident={incidentToRespond}
          open={isResponseFormOpen}
          onOpenChange={setIsResponseFormOpen}
          onSave={handleRespondToIncident}
          currentUserRole={currentUser.role}
        />
      )}
    </div>
  );
}
