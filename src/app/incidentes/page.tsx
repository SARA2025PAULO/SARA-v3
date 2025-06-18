"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { IncidentFormDialog, type IncidentFormValues } from "@/components/incidentes/IncidentFormDialog";
import { IncidentResponseDialog, type IncidentResponseFormValues } from "@/components/incidentes/IncidentResponseDialog";
import { IncidentCard } from "@/components/incidentes/IncidentCard";
import type { Incident, Contract, IncidentStatus } from "@/types";
import { PlusCircle, Search, ShieldAlert } from "lucide-react";
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

export default function IncidentesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userActiveContracts, setUserActiveContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false);
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [incidentToRespond, setIncidentToRespond] = useState<Incident | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | IncidentStatus>("todos");

  // Fetch active contracts for the current user
  const fetchUserActiveContracts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const contractsRef = collection(db, "contracts");
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(
          contractsRef,
          where("landlordId", "==", currentUser.uid),
          where("status", "==", "Activo")
        );
      } else if (currentUser.role === "Inquilino") {
        q = query(
          contractsRef,
          where("tenantId", "==", currentUser.uid),
          where("status", "==", "Activo")
        );
      } else {
        setUserActiveContracts([]);
        return;
      }
      const snapshot = await getDocs(q);
      setUserActiveContracts(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Contract) })));
    } catch (error) {
      console.error("Error fetching user contracts:", error);
      toast({ title: "Error", description: "No se pudieron cargar los contratos activos.", variant: "destructive" });
    }
  }, [currentUser, toast]);

  // Fetch incidents for the current user
  const fetchIncidents = useCallback(async () => {
    if (!currentUser) {
      setIncidents([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const incidentsRef = collection(db, "incidents");
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(incidentsRef, where("landlordId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else if (currentUser.role === "Inquilino") {
        q = query(incidentsRef, where("tenantId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else {
        setIncidents([]);
        setIsLoading(false);
        return;
      }
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate().toISOString() : data.respondedAt,
          closedAt: data.closedAt?.toDate ? data.closedAt.toDate().toISOString() : data.closedAt,
        } as Incident;
      });
      setIncidents(list);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast({ title: "Error al Cargar Incidentes", description: "No se pudieron obtener los incidentes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserActiveContracts();
    fetchIncidents();
  }, [currentUser, fetchUserActiveContracts, fetchIncidents]);

  // Create a new incident
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

      // Base incident data, now includes attachment info directly from `values`
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
      fetchIncidents();
      setIsIncidentFormOpen(false);
    } catch (error) {
      console.error("Error creando incidente:", error);
      toast({ title: "Error al Crear Incidente", description: "No se pudo crear el incidente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Respond to an incident
  const handleRespondToIncident = async (incidentId: string, values: IncidentResponseFormValues) => {
    if (!currentUser || !incidentToRespond || incidentToRespond.status === "cerrado") {
      toast({ title: "Error de Permiso", description: "No puedes responder a este incidente.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const incidentRef = doc(db, "incidents", incidentId);

      // Upload response attachment if present
      let attachmentUrlValue: string | undefined;
      let attachmentNameValue: string | undefined;
      if (values.responseAttachment && values.responseAttachment.length > 0) {
        const file = values.responseAttachment[0];
        const storage = getStorage();
        const storageRef = ref(storage, `incident_attachments/${incidentId}/${Date.now()}_${file.name}`);
        const metadata = { contentDisposition: `attachment; filename="${file.name}"` };
        const snapshot = await uploadBytes(storageRef, file, metadata);
        attachmentUrlValue = await getDownloadURL(snapshot.ref);
        attachmentNameValue = file.name;
      }

      const newResponse = {
        responseText: values.responseText,
        respondedAt: new Date().toISOString(),
        respondedBy: currentUser.uid,
        ...(attachmentUrlValue && { responseAttachmentUrl: attachmentUrlValue }),
        ...(attachmentNameValue && { responseAttachmentName: attachmentNameValue }),
      };

      await updateDoc(incidentRef, {
        responses: arrayUnion(newResponse),
        ...(incidentToRespond.status === "pendiente" && { status: "respondido" }),
      });

      toast({ title: "Respuesta Enviada", description: "Tu respuesta ha sido registrada." });
      fetchIncidents();
      setIsResponseFormOpen(false);
      setIncidentToRespond(null);
    } catch (error) {
      console.error("Error al responder incidente:", error);
      toast({ title: "Error al Responder", description: "No se pudo enviar tu respuesta.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close an incident
  const handleCloseIncident = async (incidentId: string) => {
    const toClose = incidents.find(i => i.id === incidentId);
    if (!currentUser || !toClose || currentUser.uid !== toClose.createdBy || toClose.status !== "respondido") {
      toast({ title: "Error de Permiso", description: "Solo el creador puede cerrar un incidente respondido.", variant: "destructive" });
      return;
    }
    setIsProcessingAction(true);
    try {
      const incidentRef = doc(db, "incidents", incidentId);
      await updateDoc(incidentRef, {
        status: "cerrado",
        closedAt: serverTimestamp(),
        closedBy: currentUser.uid,
      });
      toast({ title: "Incidente Cerrado", description: "El incidente ha sido cerrado.", variant: "success" });
      fetchIncidents();
    } catch (error) {
      console.error("Error al cerrar incidente:", error);
      toast({ title: "Error", description: "No se pudo cerrar el incidente.", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const openResponseDialog = (inc: Incident) => {
    setIncidentToRespond(inc);
    setIsResponseFormOpen(true);
  };

  if (isLoading && incidents.length === 0 && userActiveContracts.length === 0) {
    return <div className="p-4">Cargando...</div>;
  }

  const incidentStatusOptions: (IncidentStatus | "todos")[] = ["todos", "pendiente", "respondido", "cerrado"];
  const userRole = currentUser?.role;

  const filteredIncidents = incidents
    .filter(i => statusFilter === "todos" || i.status === statusFilter)
    .filter(i =>
      (i.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userRole === "Arrendador" && (i.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userRole === "Inquilino" && (i.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center">
          <ShieldAlert className="h-8 w-8 mr-2 text-primary" />
          Gestión de Incidentes
        </h1>
        {currentUser && (
          <Button onClick={() => setIsIncidentFormOpen(true)} disabled={isSubmitting || userActiveContracts.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Crear Incidente
          </Button>
        )}
        {userActiveContracts.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">Debes tener contratos activos para crear incidentes.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por propiedad, tipo, descripción, persona..."
            className="pl-10 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <TabsList className="overflow-x-auto whitespace-nowrap">
            {incidentStatusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize px-3 py-1.5 text-sm">
                {status === "todos" ? "Todos" : status.charAt(0).toUpperCase() + status.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="text-center py-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No se encontraron incidentes</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todos" ? "Intenta con otros filtros. " : ""}
            <Button variant="link" onClick={() => setIsIncidentFormOpen(true)} disabled={userActiveContracts.length === 0}>
              Crea un nuevo incidente
            </Button>
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
                inc.status === "pendiente" &&
                currentUser &&
                inc.createdBy !== currentUser.uid
                  ? openResponseDialog
                  : undefined
              }
              onClose={
                inc.status === "respondido" &&
                currentUser &&
                inc.createdBy === currentUser.uid
                  ? handleCloseIncident
                  : undefined
              }
              isProcessing={isProcessingAction || isSubmitting}
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
