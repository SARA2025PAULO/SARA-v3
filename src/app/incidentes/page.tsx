
"use client";

import { useState, useEffect, useCallback } from "react";
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
  collectionGroup
} from "firebase/firestore";

export default function IncidentesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userActiveContracts, setUserActiveContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For forms
  const [isProcessingAction, setIsProcessingAction] = useState(false); // For card actions like close

  const [isIncidentFormOpen, setIsIncidentFormOpen] = useState(false);
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [incidentToRespond, setIncidentToRespond] = useState<Incident | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | IncidentStatus>("todos");

  const fetchUserActiveContracts = useCallback(async () => {
    if (currentUser && db) {
      try {
        const contractsRef = collection(db, "contracts");
        let q;
        if (currentUser.role === "Arrendador") {
          q = query(contractsRef, 
            where("landlordId", "==", currentUser.uid),
            where("status", "==", "Activo") 
          );
        } else if (currentUser.role === "Inquilino") {
           q = query(contractsRef, 
            where("tenantId", "==", currentUser.uid),
            where("status", "==", "Activo") 
          );
        } else {
          setUserActiveContracts([]);
          return;
        }
        const contractsSnapshot = await getDocs(q);
        const fetchedContracts = contractsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contract));
        setUserActiveContracts(fetchedContracts);
      } catch (error) {
        console.error("Error fetching user's active contracts:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus contratos activos.", variant: "destructive" });
      }
    }
  }, [currentUser, toast]);

  const fetchIncidents = useCallback(async () => {
    if (!currentUser || !db) {
      setIsLoading(false);
      setIncidents([]);
      return;
    }
    setIsLoading(true);
    try {
      const incidentsCollectionRef = collection(db, "incidents");
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(incidentsCollectionRef, where("landlordId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else if (currentUser.role === "Inquilino") {
        q = query(incidentsCollectionRef, where("tenantId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else {
        setIncidents([]);
        setIsLoading(false);
        return;
      }
      const querySnapshot = await getDocs(q);
      const fetchedIncidents = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          respondedAt: data.respondedAt?.toDate ? data.respondedAt.toDate().toISOString() : data.respondedAt,
          closedAt: data.closedAt?.toDate ? data.closedAt.toDate().toISOString() : data.closedAt,
        } as Incident;
      });
      setIncidents(fetchedIncidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast({ title: "Error al Cargar Incidentes", description: "No se pudieron obtener los incidentes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchIncidents();
    fetchUserActiveContracts();
  }, [currentUser, fetchIncidents, fetchUserActiveContracts]);

  const handleCreateIncident = async (values: IncidentFormValues) => {
    if (!currentUser || !db) {
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
        setIsSubmitting(false);
        return;
      }

      let attachmentUrlValue: string | undefined = undefined;
      if (values.initialAttachment && values.initialAttachment.length > 0) {
        const file = values.initialAttachment[0];
        // TODO: Implement Firebase Storage upload here
        attachmentUrlValue = file.name; // Placeholder
      }

      const incidentData: Omit<Incident, 'id' | 'createdAt' | 'status' | 'respondedAt' | 'closedAt' | 'closedBy' | 'responseText' | 'responseAttachmentUrl' | 'respondedBy'> & { createdAt: any, status: IncidentStatus } = {
        contractId: selectedContract.id,
        propertyId: selectedContract.propertyId,
        propertyName: selectedContract.propertyName || "N/A",
        landlordId: selectedContract.landlordId,
        landlordName: selectedContract.landlordName || "Arrendador",
        tenantId: selectedContract.tenantId,
        tenantName: selectedContract.tenantName || "Inquilino",
        type: values.type,
        description: values.description, // Initial description
        status: "pendiente",
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        ...(attachmentUrlValue && { initialAttachmentUrl: attachmentUrlValue }),
      };
      
      await addDoc(collection(db, "incidents"), incidentData);
      
      toast({ title: "Incidente Creado", description: `El incidente tipo '${values.type}' ha sido creado y notificado.` });
      fetchIncidents(); 
      setIsIncidentFormOpen(false);
    } catch (error) {
      console.error("Error creating incident:", error);
      toast({ title: "Error al Crear Incidente", description: "No se pudo guardar el incidente.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondToIncident = async (incidentId: string, values: IncidentResponseFormValues) => {
     if (!currentUser || !db || !incidentToRespond || currentUser.uid === incidentToRespond.createdBy || incidentToRespond.status !== 'pendiente') {
      toast({ title: "Error de Permiso", description: "No puedes responder a este incidente.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const incidentDocRef = doc(db, "incidents", incidentId);
      
      let attachmentUrlValue: string | undefined = undefined;
      if (values.responseAttachment && values.responseAttachment.length > 0) {
        const file = values.responseAttachment[0];
        // TODO: Implement Firebase Storage upload here for response attachment
        attachmentUrlValue = file.name; // Placeholder
      }

      await updateDoc(incidentDocRef, {
        responseText: values.responseText,
        status: "respondido",
        respondedAt: serverTimestamp(),
        respondedBy: currentUser.uid,
        ...(attachmentUrlValue && { responseAttachmentUrl: attachmentUrlValue }),
      });
      toast({ title: "Respuesta Enviada", description: "Tu respuesta al incidente ha sido enviada." });
      fetchIncidents();
      setIsResponseFormOpen(false);
      setIncidentToRespond(null);
    } catch (error) {
      console.error("Error responding to incident:", error);
      toast({ title: "Error al Responder", description: "No se pudo enviar tu respuesta.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseIncident = async (incidentId: string) => {
    const incidentToClose = incidents.find(inc => inc.id === incidentId);
    if (!currentUser || !db || !incidentToClose || currentUser.uid !== incidentToClose.createdBy || incidentToClose.status !== 'respondido') {
        toast({ title: "Error de Permiso", description: "Solo el creador puede cerrar un incidente respondido.", variant: "destructive" });
        return;
    }
    setIsProcessingAction(true);
    try {
      const incidentDocRef = doc(db, "incidents", incidentId);
      await updateDoc(incidentDocRef, { 
        status: "cerrado",
        closedAt: serverTimestamp(),
        closedBy: currentUser.uid,
      });
      toast({ 
        title: "Incidente Cerrado", 
        description: "El incidente ha sido marcado como cerrado.",
        className: "bg-accent text-accent-foreground",
      });
      fetchIncidents();
    } catch (error) {
      console.error("Error closing incident:", error);
      toast({ title: "Error", description: "No se pudo cerrar el incidente.", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };
    
  const openResponseDialog = (incident: Incident) => {
    setIncidentToRespond(incident);
    setIsResponseFormOpen(true);
  };

  if (isLoading && incidents.length === 0 && userActiveContracts.length === 0) return <div className="p-4">Cargando...</div>;


  const incidentStatusOptions: (IncidentStatus | "todos")[] = ["todos", "pendiente", "respondido", "cerrado"];
  const userRole = currentUser?.role;

  const filteredIncidents = incidents
    .filter(p => statusFilter === "todos" || p.status === statusFilter)
    .filter(p => 
      (p.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userRole === "Arrendador" && (p.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userRole === "Inquilino" && (p.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline flex items-center"><ShieldAlert className="h-8 w-8 mr-2 text-primary"/> Gestión de Incidentes</h1>
        {currentUser && ( // Both roles can create incidents
          <Button onClick={() => setIsIncidentFormOpen(true)} size="lg" disabled={isSubmitting || userActiveContracts.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Incidente
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
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
            <Button variant="link" className="p-0 h-auto" onClick={() => setIsIncidentFormOpen(true)} disabled={userActiveContracts.length === 0}>
              Crea un nuevo incidente
            </Button>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              currentUser={currentUser}
              onRespond={incident.status === 'pendiente' && currentUser && incident.createdBy !== currentUser.uid ? openResponseDialog : undefined}
              onClose={incident.status === 'respondido' && currentUser && incident.createdBy === currentUser.uid ? handleCloseIncident : undefined}
              isProcessing={isProcessingAction || isSubmitting}
            />
          ))}
        </div>
      )}

      {currentUser && (
        <IncidentFormDialog
          open={isIncidentFormOpen}
          onOpenChange={setIsIncidentFormOpen}
          onSave={handleCreateIncident}
          userContracts={userActiveContracts}
          currentUserRole={currentUser.role}
        />
      )}

      {incidentToRespond && currentUser && (
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
