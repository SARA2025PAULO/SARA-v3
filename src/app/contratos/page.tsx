"use client";
      
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ContractCard } from "@/components/contratos/ContractCard";
import { ContractFormDialog, ContractFormValues } from "@/components/contratos/ContractFormDialog";
import { ContractApprovalDialog } from "@/components/contratos/ContractApprovalDialog";
import { ContractObservationDialog } from "@/components/contratos/ContractObservationDialog";
import { ContractDetailDialog } from "@/components/contratos/ContractDetailDialog"; 
import type { Contract, Property, UserProfile, ContractObservation, Announcement } from "@/types";
import { PlusCircle, FileText, Search } from "lucide-react";
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
  serverTimestamp,
  updateDoc,
  orderBy,
  limit,
  deleteDoc,
  or,
  and,
  arrayUnion
} from "firebase/firestore";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";


export default function ContratosPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]); 
  const [availablePropertiesCount, setAvailablePropertiesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null); 
  
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [contractToApprove, setContractToApprove] = useState<Contract | null>(null);
  
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [contractToObserve, setContractToObserve] = useState<Contract | null>(null);

  const [contractToDisplayDetailsId, setContractToDisplayDetailsId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isRespondingToObservation, setIsRespondingToObservation] = useState(false); 

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Contract["status"]>("todos");

  const createAnnouncement = async (recipientId: string, title: string, message: string, link: string) => {
    if (!db) return;
    try {
      const newAnnouncement: Announcement = {
        recipientId,
        title,
        message,
        link,
        read: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "announcements"), newAnnouncement);
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const fetchLandlordProperties = useCallback(async () => {
    if (currentUser && currentUser.role === "Arrendador" && db) {
      try {
        const qProps = query(collection(db, "propiedades"), where("ownerId", "==", currentUser.uid), where("status", "in", ["Disponible", "Arrendada"]));
        const propsSnapshot = await getDocs(qProps);
        const fetchedProps = propsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Property));
        const availableCount = fetchedProps.filter(p => p.status === "Disponible").length;
        setAvailablePropertiesCount(availableCount);
        setLandlordProperties(fetchedProps);
      } catch (error) {
        console.error("Error fetching landlord properties:", error);
        toast({ title: "Error", description: "No se pudieron cargar las propiedades.", variant: "destructive" });
      }
    }
  }, [currentUser, toast]);

  const fetchContracts = useCallback(async () => {
    if (!currentUser || !db) {
      setIsLoading(false);
      setContracts([]);
      return;
    }
    setIsLoading(true);
    try {
      const contractsCollectionRef = collection(db, "contracts");
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(contractsCollectionRef, where("landlordId", "==", currentUser.uid), orderBy("createdAt", "desc"));
      } else if (currentUser.role === "Inquilino") {
        q = query(contractsCollectionRef, 
          or(
            where("tenantId", "==", currentUser.uid),
            and(
              where("tenantEmail", "==", currentUser.email),
              where("status", "==", "pendiente")
            )
          ),
          orderBy("createdAt", "desc")
        );
      } else {
        setContracts([]);
        setIsLoading(false);
        return;
      }
      const querySnapshot = await getDocs(q);
      const fetchedContracts = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate?.toDate ? data.startDate.toDate().toISOString() : data.startDate,
          endDate: data.endDate?.toDate ? data.endDate.toDate().toISOString() : data.endDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          approvedAt: data.approvedAt?.toDate ? data.approvedAt.toDate().toISOString() : data.approvedAt,
          rejectedAt: data.rejectedAt?.toDate ? data.rejectedAt.toDate().toISOString() : data.rejectedAt,
          terminatedAt: data.terminatedAt?.toDate ? data.terminatedAt.toDate().toISOString() : data.terminatedAt,
          securityDepositAmount: data.securityDepositAmount,
          rentPaymentDay: data.rentPaymentDay,
          commonExpensesPaymentDay: data.commonExpensesPaymentDay,
          utilitiesPaymentDay: data.utilitiesPaymentDay,
          existingContractUrl: data.existingContractUrl || undefined,
          existingContractFileName: data.existingContractFileName || undefined,
          observations: data.observations || [], 
        } as Contract;
      });
      setContracts(fetchedContracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast({ title: "Error al Cargar Contratos", description: "No se pudieron obtener los contratos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchContracts();
    if (currentUser?.role === "Arrendador") {
      fetchLandlordProperties();
    }
  }, [currentUser, fetchContracts, fetchLandlordProperties]);

  const handleSaveContract = async (values: ContractFormValues & { existingContractUrl: string | null; existingContractFileName: string | null; }, isEditingFlag: boolean, originalContractId?: string) => {
    if (!currentUser || currentUser.role !== "Arrendador" || !db) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const usersRef = collection(db, "users");
      const tenantQuery = query(usersRef, where("email", "==", values.tenantEmail), where("role", "==", "Inquilino"), limit(1));
      const tenantSnapshot = await getDocs(tenantQuery);
  
      let tenantUid: string | undefined = undefined;
      let tenantProfile: UserProfile | undefined = undefined;
  
      if (!tenantSnapshot.empty) {
        const tenantDoc = tenantSnapshot.docs[0];
        tenantProfile = tenantDoc.data() as UserProfile;
        tenantUid = tenantDoc.id;
      } else {
        toast({ title: "Inquilino no Encontrado", description: `No se encontró un inquilino con el correo: ${values.tenantEmail}. Se enviará una invitación.`, variant: "default" });
      }
      
      const selectedProperty = landlordProperties.find(p => p.id === values.propertyId);
      if (!selectedProperty) {
          toast({ title: "Error", description: "Propiedad seleccionada no válida.", variant: "destructive" });
          setIsSubmitting(false);
          return;
      }
  
      const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt' | 'observations' | 'paymentDay'> & { createdAt?: any, updatedAt: any, observations?: any[] } = {
        propertyId: values.propertyId,
        propertyName: selectedProperty.address,
        propertyAddress: selectedProperty.address,
        propertyRolAvaluo: values.propertyRolAvaluo,
        propertyCBRFojas: values.propertyCBRFojas,
        propertyCBRNumero: values.propertyCBRNumero,
        propertyCBRAno: values.propertyCBRAno,
        tenantId: tenantUid, 
        tenantEmail: values.tenantEmail,
        tenantName: tenantProfile?.displayName || values.tenantName, 
        tenantRut: values.tenantRut,
        tenantNationality: values.tenantNationality,
        tenantCivilStatus: values.tenantCivilStatus,
        tenantProfession: values.tenantProfession,
        tenantAddressForNotifications: values.tenantAddressForNotifications,
        landlordId: currentUser.uid,
        landlordName: currentUser.displayName,
        landlordEmail: currentUser.email,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        rentAmount: values.rentAmount,
        securityDepositAmount: values.securityDepositAmount === '' || values.securityDepositAmount === undefined ? undefined : Number(values.securityDepositAmount),
        commonExpensesIncluded: values.commonExpensesIncluded,
        rentPaymentDay: values.rentPaymentDay === '' || values.rentPaymentDay === undefined ? undefined : Number(values.rentPaymentDay),
        commonExpensesPaymentDay: values.commonExpensesIncluded === 'no' && (values.commonExpensesPaymentDay !== '' && values.commonExpensesPaymentDay !== undefined) ? Number(values.commonExpensesPaymentDay) : undefined,
        utilitiesPaymentDay: values.utilitiesPaymentDay === '' || values.utilitiesPaymentDay === undefined ? undefined : Number(values.utilitiesPaymentDay),
        terms: values.terms || "",
        status: isEditingFlag && editingContract ? editingContract.status : "pendiente", 
        updatedAt: serverTimestamp(),
        existingContractUrl: values.existingContractUrl,
        existingContractFileName: values.existingContractFileName,
        observations: isEditingFlag && editingContract?.observations ? editingContract.observations : [],
      };
      
      const cleanedContractData = Object.fromEntries(
        Object.entries(contractData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );

      if (isEditingFlag && originalContractId) {
        const contractDocRef = doc(db, "contracts", originalContractId);
        await updateDoc(contractDocRef, cleanedContractData);
        toast({ title: "Contrato Actualizado", description: `El contrato para ${selectedProperty.address} ha sido guardado.` });
        if (tenantUid) {
          createAnnouncement(tenantUid, "Contrato Actualizado", `El arrendador ha actualizado el contrato de ${selectedProperty.address}. Revísalo.`, `/contratos`);
        }
      } else {
        const finalContractData = { ...cleanedContractData, createdAt: serverTimestamp() };
        await addDoc(collection(db, "contracts"), finalContractData);
        toast({ title: "Contrato Creado", description: `Nuevo contrato para ${selectedProperty.address} está ${contractData.status}.` });
        createAnnouncement(currentUser.uid, "Contrato Creado", `Has creado un nuevo contrato para ${selectedProperty.address}.`, `/contratos`);
        if (tenantUid) {
          createAnnouncement(tenantUid, "Nuevo Contrato Disponible", `Tienes un nuevo contrato pendiente de revisión para ${selectedProperty.address}.`, `/contratos`);
        }
      }
      
      fetchContracts(); 
      setIsContractFormOpen(false);
      setEditingContract(null); 

    } catch (error) {
      console.error("Error saving contract:", error);
      toast({ title: "Error al Guardar Contrato", description: "No se pudo guardar el contrato.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveObservation = async (contractId: string, observationText: string) => {
    if (!currentUser || !db || !currentUser.role || !currentUser.displayName) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const contractRef = doc(db, "contracts", contractId);
      const newObservation: ContractObservation = {
        id: Date.now().toString(), 
        type: "observation",
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        fromUserRole: currentUser.role,
        text: observationText,
        createdAt: new Date().toISOString(),
      };
      await updateDoc(contractRef, {
        observations: arrayUnion(newObservation), 
        updatedAt: serverTimestamp(), 
      });
      toast({ title: "Observación Enviada", variant: "success" });
      fetchContracts(); 
      setIsObservationDialogOpen(false);
      setContractToObserve(null);
      
      const observedContract = contracts.find(c => c.id === contractId);
      if (observedContract?.landlordId) {
        createAnnouncement(observedContract.landlordId, "Nueva Observación en Contrato", `El inquilino ha comentado el contrato de ${observedContract.propertyName}.`, `/contratos`);
      }
    } catch (error) {
      console.error("Error saving observation:", error);
      toast({ title: "Error al Enviar Observación", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondToContractObservation = async (contractId: string, responseText: string) => {
    if (!currentUser || !db || !currentUser.role || !currentUser.displayName) {
      toast({ title: "Error", description: "Usuario no autenticado.", variant: "destructive" });
      return;
    }
    setIsRespondingToObservation(true); 
    try {
      const contractRef = doc(db, "contracts", contractId);
      const newResponse: ContractObservation = {
        id: Date.now().toString(), 
        type: "response",
        fromUserId: currentUser.uid,
        fromUserName: currentUser.displayName,
        fromUserRole: currentUser.role,
        text: responseText,
        createdAt: new Date().toISOString(),
      };
      await updateDoc(contractRef, {
        observations: arrayUnion(newResponse), 
        updatedAt: serverTimestamp(), 
      });
      toast({ title: "Respuesta Enviada", variant: "success" });
      fetchContracts(); 
      
      const respondedContract = contracts.find(c => c.id === contractId);
      if (respondedContract?.tenantId) {
        createAnnouncement(respondedContract.tenantId, "Respuesta a Observación", `El arrendador ha respondido a tu observación en el contrato de ${respondedContract.propertyName}.`, `/contratos`);
      }
    } catch (error) {
      console.error("Error saving response:", error);
      toast({ title: "Error al Enviar Respuesta", variant: "destructive" });
    } finally {
      setIsRespondingToObservation(false); 
    }
  };

  const handleApprovalAction = async (contractId: string, newStatus: "activo" | "rechazado") => {
    if (!db || !currentUser) return;
    setIsSubmitting(true);
    try {
      const contractDocRef = doc(db, "contracts", contractId);
      const updateData: { status: "activo" | "rechazado", updatedAt: any, approvedAt?: any, rejectedAt?: any, tenantId?: string } = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (newStatus === "activo") {
        updateData.tenantId = currentUser.uid;
        updateData.approvedAt = serverTimestamp();
      } else if (newStatus === "rechazado") {
        updateData.rejectedAt = serverTimestamp();
      }
      await updateDoc(contractDocRef, updateData);
      
      const contract = contracts.find(c => c.id === contractId);
      if(newStatus === "activo" && contract) {
        const propDocRef = doc(db, "propiedades", contract.propertyId);
        await updateDoc(propDocRef, { status: "Arrendada" });
      }

      toast({ 
        title: `Contrato ${newStatus === "activo" ? "Aprobado" : "Rechazado"}`,
        className: newStatus === "activo" ? "bg-accent text-accent-foreground" : undefined,
      });
      fetchContracts(); 
      setIsApprovalDialogOpen(false);
      
      const approvedOrRejectedContract = contracts.find(c => c.id === contractId);
      if (approvedOrRejectedContract) {
        const message = newStatus === "activo" ? `Tu contrato para ${approvedOrRejectedContract.propertyName} ha sido APROBADO.` : `Tu contrato para ${approvedOrRejectedContract.propertyName} ha sido RECHAZADO.`;
        const title = newStatus === "activo" ? "Contrato Aprobado" : "Contrato Rechazado";

        if (approvedOrRejectedContract.tenantId) createAnnouncement(approvedOrRejectedContract.tenantId, title, message, `/contratos`);
        createAnnouncement(approvedOrRejectedContract.landlordId, title, message, `/contratos`);
      }

      if (contractToDisplayDetailsId) {
        setIsDetailDialogOpen(false); 
        setContractToDisplayDetailsId(null);
      }

    } catch (error) {
      console.error(`Error:`, error);
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteContractConfirmed = async () => {
    if (!contractToDelete || !db) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "contracts", contractToDelete.id));
      toast({ title: "Contrato Eliminado", variant: "default" });
      fetchContracts(); 
      setIsDeleteDialogOpen(false);
      setContractToDelete(null);
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({ title: "Error al Eliminar Contrato", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  const openApprovalDialog = (contract: Contract) => {
    setContractToApprove(contract);
    setIsApprovalDialogOpen(true);
  };
  
  const openContractFormDialog = (contract?: Contract) => {
    setEditingContract(contract || null);
    setIsContractFormOpen(true);
  }

  const openObservationDialog = (contract: Contract) => {
    setContractToObserve(contract);
    setIsObservationDialogOpen(true);
  };
  
  const handleGenerateContractPdf = async (contract: Contract) => {
      setIsGeneratingPdf(true);
      try {
          const mockPdfUrl = contract.existingContractUrl || "https://www.africau.edu/images/default/sample.pdf"; 

          if (mockPdfUrl) {
              window.open(mockPdfUrl, '_blank');
              toast({ title: "PDF Generado", variant: "success" });
          } else {
              toast({ title: "Error", description: "No se pudo obtener la URL del PDF.", variant: "destructive" });
          }
      } catch (error) {
          console.error("Error generating PDF:", error);
          toast({ title: "Error al Generar PDF", variant: "destructive" });
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const openContractDetailDialog = (contract: Contract) => {
    setContractToDisplayDetailsId(contract.id); 
    setIsApprovalDialogOpen(false); 
    setIsObservationDialogOpen(false); 
    const foundContract = contracts.find(c => c.id === contract.id);
    if (foundContract) { 
      setIsDetailDialogOpen(true);
    } else { 
      setIsDetailDialogOpen(false);
    }
  };

  const contractToDisplayDetails = contractToDisplayDetailsId 
    ? contracts.find(c => c.id === contractToDisplayDetailsId)
    : null;

  const filteredContracts = contracts
    .filter(c => statusFilter === "todos" || c.status === statusFilter)
    .filter(c => 
      (c.propertyName || c.propertyId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (currentUser?.role === "Arrendador" && (c.tenantName || c.tenantEmail || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (currentUser?.role === "Inquilino" && (c.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
  if (isLoading && contracts.length === 0) return <div className="p-4">Cargando contratos...</div>;

  const contractStatusOptions: (Contract["status"] | "todos")[] = ["todos", "pendiente", "activo", "finalizado", "rechazado", "aprobado"]; 

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Gestión de Contratos</h1>
        {currentUser?.role === "Arrendador" && (
          <Button onClick={() => openContractFormDialog()} size="lg" disabled={isSubmitting || availablePropertiesCount === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
          </Button>
        )}
         {currentUser?.role === "Arrendador" && availablePropertiesCount === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Añade propiedades disponibles para poder crear contratos.</p>
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
            {contractStatusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize px-3 py-1.5 text-sm">
                {status === "todos" ? "Todos" : status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredContracts.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No se encontraron contratos</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "todos" ? "Intenta con otros filtros o " : (currentUser?.role === "Arrendador" ? "Comienza por " : "")}
            {currentUser?.role === "Arrendador" && availablePropertiesCount > 0 &&
              <Button variant="link" className="p-0 h-auto" onClick={() => openContractFormDialog()}>crear un nuevo contrato</Button>
            }
            {currentUser?.role !== "Arrendador" && "No tienes contratos que coincidan con los filtros."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              userRole={currentUser?.role || null}
              onApprove={currentUser?.role === "Inquilino" && contract.status.toLowerCase() === "pendiente" ? () => openApprovalDialog(contract) : undefined}
              onReject={currentUser?.role === "Inquilino" && contract.status.toLowerCase() === "pendiente" ? () => openApprovalDialog(contract) : undefined} 
              onManage={currentUser?.role === "Arrendador" ? () => openContractFormDialog(contract) : undefined}
              onDelete={currentUser?.role === "Arrendador" ? () => openDeleteDialog(contract) : undefined} 
              onMakeObservation={currentUser?.role === "Inquilino" && contract.status.toLowerCase() === "pendiente" ? () => openObservationDialog(contract) : undefined}
              onViewDetails={openContractDetailDialog} 
            />
          ))}
        </div>
      )}

      {currentUser?.role === "Arrendador" && (
        <ContractFormDialog
          contract={editingContract ?? undefined}
          open={isContractFormOpen}
          onOpenChange={setIsContractFormOpen}
          onSave={handleSaveContract}
          userProperties={landlordProperties}
          isSubmitting={isSubmitting}
        />
      )}
      
      {contractToApprove && ( 
        <ContractApprovalDialog
          contract={contractToApprove}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          onApprove={() => handleApprovalAction(contractToApprove.id, "activo")}
          onReject={() => handleApprovalAction(contractToApprove.id, "rechazado")}
          isSubmitting={isSubmitting}
        />
      )}

      {contractToObserve && (
        <ContractObservationDialog
          open={isObservationDialogOpen}
          onOpenChange={setIsObservationDialogOpen}
          contract={contractToObserve}
          onSaveObservation={handleSaveObservation}
          isSubmitting={isSubmitting} 
        />
      )}

      {contractToDisplayDetails && (
        <ContractDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setContractToDisplayDetailsId(null); 
            setIsDetailDialogOpen(isOpen);
          }}
          contract={contractToDisplayDetails}
          currentUserRole={currentUser?.role || null}
          onRespondToObservation={handleRespondToContractObservation}
          isSubmittingResponse={isRespondingToObservation}
          onGeneratePdf={handleGenerateContractPdf} 
          isGeneratingPdf={isGeneratingPdf} 
        />
      )}

      {contractToDelete && (
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Eliminar Contrato"
          description={`¿Estás seguro de que quieres eliminar el contrato de ${contractToDelete.propertyName}? Esta acción no se puede revertir.`}
          onConfirm={handleDeleteContractConfirmed}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDestructive={true}
        />
      )}
    </div>
  );
}
