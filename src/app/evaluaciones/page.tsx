
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { EvaluationFormDialog, type EvaluationFormValues } from "@/components/evaluaciones/EvaluationFormDialog";
import { TenantEvaluationConfirmationDialog, type ConfirmationFormValues } from "@/components/evaluaciones/TenantEvaluationConfirmationDialog";
import { EvaluationCard } from "@/components/evaluaciones/EvaluationCard";
import type { Evaluation, Contract } from "@/types";
import { ClipboardCheck, PlusCircle, Search } from "lucide-react";
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

export default function EvaluacionesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [userContracts, setUserContracts] = useState<Contract[]>([]); // For landlord to select contract to evaluate
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEvaluationFormOpen, setIsEvaluationFormOpen] = useState(false);
  const [selectedContractForEval, setSelectedContractForEval] = useState<Contract | null>(null);

  const [isConfirmationFormOpen, setIsConfirmationFormOpen] = useState(false);
  const [evaluationToConfirm, setEvaluationToConfirm] = useState<Evaluation | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Evaluation["status"]>("todos");

  const fetchUserContracts = useCallback(async () => {
    if (currentUser?.role === "Arrendador" && db) {
      try {
        const contractsRef = collection(db, "contracts");
        const q = query(contractsRef, 
          where("landlordId", "==", currentUser.uid),
          where("status", "in", ["Activo", "Finalizado"]) 
        );
        const contractsSnapshot = await getDocs(q);
        const fetchedContracts = contractsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contract));
        setUserContracts(fetchedContracts);
      } catch (error) {
        console.error("Error fetching landlord's contracts:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus contratos.", variant: "destructive" });
      }
    }
  }, [currentUser, toast]);

  const fetchEvaluations = useCallback(async () => {
    if (!currentUser || !db) {
      setIsLoading(false);
      setEvaluations([]);
      return;
    }
    setIsLoading(true);
    try {
      const evaluationsCollectionRef = collection(db, "evaluations");
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(evaluationsCollectionRef, where("landlordId", "==", currentUser.uid), orderBy("evaluationDate", "desc"));
      } else if (currentUser.role === "Inquilino") {
        q = query(evaluationsCollectionRef, where("tenantId", "==", currentUser.uid), orderBy("evaluationDate", "desc"));
      } else {
        setEvaluations([]);
        setIsLoading(false);
        return;
      }
      const querySnapshot = await getDocs(q);
      const fetchedEvaluations = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          evaluationDate: data.evaluationDate?.toDate ? data.evaluationDate.toDate().toISOString() : data.evaluationDate,
          tenantConfirmedAt: data.tenantConfirmedAt?.toDate ? data.tenantConfirmedAt.toDate().toISOString() : data.tenantConfirmedAt,
        } as Evaluation;
      });
      setEvaluations(fetchedEvaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      toast({ title: "Error al Cargar Evaluaciones", description: "No se pudieron obtener las evaluaciones.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchEvaluations();
    if (currentUser?.role === "Arrendador") {
      fetchUserContracts();
    }
  }, [currentUser, fetchEvaluations, fetchUserContracts]);

  const handleCreateEvaluation = async (values: EvaluationFormValues) => {
    if (!currentUser || currentUser.role !== "Arrendador" || !db) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const contractToEvaluate = userContracts.find(c => c.id === values.contractId);
      if (!contractToEvaluate) {
        toast({ title: "Error", description: "Contrato seleccionado no válido.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const evaluationData: Omit<Evaluation, 'id' | 'evaluationDate' | 'status' | 'tenantComment' | 'tenantConfirmedAt' | 'overallRating'> & { evaluationDate: any, status: EvaluationStatus } = {
        contractId: contractToEvaluate.id,
        propertyId: contractToEvaluate.propertyId,
        propertyName: contractToEvaluate.propertyName || "N/A",
        landlordId: currentUser.uid,
        landlordName: currentUser.displayName || "Arrendador",
        tenantId: contractToEvaluate.tenantId,
        tenantName: contractToEvaluate.tenantName || contractToEvaluate.tenantEmail,
        criteria: values.criteria,
        evaluationDate: serverTimestamp(),
        status: "pendiente de confirmacion",
      };
      
      await addDoc(collection(db, "evaluations"), evaluationData);
      
      toast({ title: "Evaluación Creada", description: `La evaluación para ${contractToEvaluate.tenantName || contractToEvaluate.tenantEmail} ha sido creada y está pendiente de confirmación.` });
      fetchEvaluations(); 
      setIsEvaluationFormOpen(false);
      setSelectedContractForEval(null);
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast({ title: "Error al Crear Evaluación", description: "No se pudo guardar la evaluación.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEvaluation = async (evaluationId: string, values: ConfirmationFormValues) => {
     if (!currentUser || currentUser.role !== "Inquilino" || !db || !evaluationToConfirm) {
      toast({ title: "Error de Permiso", description: "No puedes realizar esta acción.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const evaluationDocRef = doc(db, "evaluations", evaluationId);
      
      await updateDoc(evaluationDocRef, {
        status: "recibida",
        tenantComment: values.tenantComment || "",
        tenantConfirmedAt: serverTimestamp(),
      });
      toast({ title: "Evaluación Confirmada", description: "Has confirmado la recepción y tu comentario ha sido guardado." });
      fetchEvaluations();
      setIsConfirmationFormOpen(false);
      setEvaluationToConfirm(null);
    } catch (error) {
      console.error("Error confirming evaluation:", error);
      toast({ title: "Error al Confirmar", description: "No se pudo guardar tu confirmación.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEvaluationDialog = (contract?: Contract) => {
    setSelectedContractForEval(contract || null); // Could be null if general "create" button is used
    setIsEvaluationFormOpen(true);
  };
  
  const openConfirmationDialog = (evaluation: Evaluation) => {
    setEvaluationToConfirm(evaluation);
    setIsConfirmationFormOpen(true);
  };

  if (isLoading && evaluations.length === 0) return <div className="p-4">Cargando evaluaciones...</div>;

  const evaluationStatusOptions: (Evaluation["status"] | "todos")[] = ["todos", "pendiente de confirmacion", "recibida"];
  const userRole = currentUser?.role;

  const filteredEvaluations = evaluations
    .filter(e => statusFilter === "todos" || e.status === statusFilter)
    .filter(e => 
      (e.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userRole === "Arrendador" && (e.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userRole === "Inquilino" && (e.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline flex items-center"><ClipboardCheck className="h-8 w-8 mr-2 text-primary"/> Gestión de Evaluaciones</h1>
        {userRole === "Arrendador" && (
          <Button onClick={() => openEvaluationDialog()} size="lg" disabled={isSubmitting || userContracts.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nueva Evaluación
          </Button>
        )}
         {userRole === "Arrendador" && userContracts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Debes tener contratos activos o finalizados para crear evaluaciones.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por propiedad, inquilino/arrendador..." 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList className="overflow-x-auto whitespace-nowrap">
            {evaluationStatusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize px-3 py-1.5 text-sm">
                {status === "todos" ? "Todas" : status.charAt(0).toUpperCase() + status.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="text-center py-10">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No se encontraron evaluaciones</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todos" ? "Intenta con otros filtros. " : ""}
            {userRole === "Arrendador" && 
              <Button variant="link" className="p-0 h-auto" onClick={() => openEvaluationDialog()} disabled={userContracts.length === 0}>
                Crea una nueva evaluación
              </Button>
            }
            {userRole === "Inquilino" && "No has recibido evaluaciones o no hay evaluaciones que coincidan con los filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvaluations.map((evaluation) => (
            <EvaluationCard
              key={evaluation.id}
              evaluation={evaluation}
              userRole={userRole}
              onConfirmReception={userRole === 'Inquilino' && evaluation.status === 'pendiente de confirmacion' ? openConfirmationDialog : undefined}
              isProcessing={isSubmitting}
            />
          ))}
        </div>
      )}

      {userRole === "Arrendador" && (
        <EvaluationFormDialog
          open={isEvaluationFormOpen}
          onOpenChange={setIsEvaluationFormOpen}
          onSave={handleCreateEvaluation}
          landlordContracts={userContracts}
          // Pass targetTenantName and targetPropertyName if selectedContractForEval is set
          targetTenantName={selectedContractForEval?.tenantName || selectedContractForEval?.tenantEmail}
          targetPropertyName={selectedContractForEval?.propertyName}
        />
      )}

      {userRole === "Inquilino" && evaluationToConfirm && (
        <TenantEvaluationConfirmationDialog
          evaluation={evaluationToConfirm}
          open={isConfirmationFormOpen}
          onOpenChange={setIsConfirmationFormOpen}
          onConfirm={handleConfirmEvaluation}
        />
      )}
    </div>
  );
}
