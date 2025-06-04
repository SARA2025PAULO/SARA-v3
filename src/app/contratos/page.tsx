
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ContractCard } from "@/components/contratos/ContractCard";
import { ContractFormDialog } from "@/components/contratos/ContractFormDialog";
import type { ContractFormValues } from "@/components/contratos/ContractFormDialog";
import { ContractApprovalDialog } from "@/components/contratos/ContractApprovalDialog";
import type { Contract, Property, UserProfile } from "@/types";
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
  limit
} from "firebase/firestore";


export default function ContratosPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null); 
  
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [contractToApprove, setContractToApprove] = useState<Contract | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Contract["status"]>("todos");

  const fetchLandlordProperties = useCallback(async () => {
    if (currentUser && currentUser.role === "Arrendador" && db) {
      try {
        const propsRef = collection(db, "users", currentUser.uid, "properties");
        const qProps = query(propsRef, where("status", "in", ["Disponible", "Arrendada"])); 
        const propsSnapshot = await getDocs(qProps);
        const fetchedProps = propsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Property));
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
        q = query(contractsCollectionRef, where("tenantId", "==", currentUser.uid), orderBy("createdAt", "desc"));
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
          startDate: data.startDate, 
          endDate: data.endDate,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          securityDepositAmount: data.securityDepositAmount,
          paymentDay: data.paymentDay,
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

  const handleSaveContract = async (values: ContractFormValues, isEditingFlag: boolean, originalContractId?: string) => {
    if (!currentUser || currentUser.role !== "Arrendador" || !db) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const usersRef = collection(db, "users");
      const tenantQuery = query(usersRef, where("email", "==", values.tenantEmail), where("role", "==", "Inquilino"), limit(1));
      const tenantSnapshot = await getDocs(tenantQuery);

      if (tenantSnapshot.empty) {
        toast({ title: "Inquilino no Encontrado", description: `No se encontró un inquilino con el rol correcto para el correo: ${values.tenantEmail}`, variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const tenantDoc = tenantSnapshot.docs[0];
      const tenantProfile = tenantDoc.data() as UserProfile;
      const tenantUid = tenantDoc.id;

      const selectedProperty = landlordProperties.find(p => p.id === values.propertyId);
      if (!selectedProperty) {
          toast({ title: "Error", description: "Propiedad seleccionada no válida.", variant: "destructive" });
          setIsSubmitting(false);
          return;
      }

      const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> & { updatedAt: any } = {
        propertyId: values.propertyId,
        propertyName: selectedProperty.address,
        tenantId: tenantUid,
        tenantEmail: values.tenantEmail,
        tenantName: tenantProfile.displayName || values.tenantName, 
        landlordId: currentUser.uid,
        landlordName: currentUser.displayName,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        rentAmount: values.rentAmount,
        securityDepositAmount: values.securityDepositAmount === '' || values.securityDepositAmount === undefined ? undefined : Number(values.securityDepositAmount),
        paymentDay: values.paymentDay === '' || values.paymentDay === undefined ? undefined : Number(values.paymentDay),
        terms: values.terms || "",
        status: isEditingFlag && editingContract ? editingContract.status : "Pendiente",
        updatedAt: serverTimestamp(),
      };
      
      // Remove undefined fields before saving to Firestore
      const cleanedContractData = Object.fromEntries(
        Object.entries(contractData).filter(([_, v]) => v !== undefined)
      );


      if (isEditingFlag && originalContractId) {
        const contractDocRef = doc(db, "contracts", originalContractId);
        await updateDoc(contractDocRef, cleanedContractData);
        toast({ title: "Contrato Actualizado", description: `El contrato para ${selectedProperty.address} ha sido guardado.` });
      } else {
        const finalContractData = { ...cleanedContractData, createdAt: serverTimestamp() };
        await addDoc(collection(db, "contracts"), finalContractData);
        toast({ title: "Contrato Creado", description: `Nuevo contrato para ${selectedProperty.address} está ${finalContractData.status}.` });
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

  const handleApprovalAction = async (contractId: string, newStatus: "Activo" | "Rechazado") => {
    if (!db) return;
    setIsSubmitting(true);
    try {
      const contractDocRef = doc(db, "contracts", contractId);
      await updateDoc(contractDocRef, { 
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({ 
        title: `Contrato ${newStatus === "Activo" ? "Aprobado" : "Rechazado"}`, 
        description: `El contrato ha sido marcado como ${newStatus.toLowerCase()}.`,
        className: newStatus === "Activo" ? "bg-accent text-accent-foreground" : undefined,
      });
      fetchContracts(); 
      setIsApprovalDialogOpen(false);
    } catch (error) {
      console.error(`Error ${newStatus === "Activo" ? "approving" : "rejecting"} contract:`, error);
      toast({ title: "Error", description: `No se pudo ${newStatus === "Activo" ? "aprobar" : "rechazar"} el contrato.`, variant: "destructive" });
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

  const handleViewDetails = (contract: Contract) => {
    toast({ title: `Detalles Contrato: ${contract.id.substring(0,8)}...`, description: `Propiedad: ${contract.propertyName}. Estado: ${contract.status}. (Funcionalidad de vista detallada pendiente).` });
  };

  const filteredContracts = contracts
    .filter(c => statusFilter === "todos" || c.status === statusFilter)
    .filter(c => 
      (c.propertyName || c.propertyId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (currentUser?.role === "Arrendador" && (c.tenantName || c.tenantEmail).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (currentUser?.role === "Inquilino" && (c.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
  if (isLoading && contracts.length === 0) return <div className="p-4">Cargando contratos...</div>;

  const contractStatusOptions: (Contract["status"] | "todos")[] = ["todos", "Pendiente", "Activo", "Finalizado", "Rechazado", "Aprobado"];


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Gestión de Contratos</h1>
        {currentUser?.role === "Arrendador" && (
          <Button onClick={() => openContractFormDialog()} size="lg" disabled={isSubmitting || landlordProperties.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
          </Button>
        )}
         {currentUser?.role === "Arrendador" && landlordProperties.length === 0 && !isLoading && (
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
            {currentUser?.role === "Arrendador" && 
              <Button variant="link" className="p-0 h-auto" onClick={() => openContractFormDialog()} disabled={landlordProperties.length === 0}>crear un nuevo contrato</Button>
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
              onViewDetails={handleViewDetails}
              onApprove={currentUser?.role === "Inquilino" && contract.status === "Pendiente" ? () => openApprovalDialog(contract) : undefined}
              onReject={currentUser?.role === "Inquilino" && contract.status === "Pendiente" ? () => openApprovalDialog(contract) : undefined} 
              onManage={currentUser?.role === "Arrendador" ? () => openContractFormDialog(contract) : undefined}
            />
          ))}
        </div>
      )}

      {currentUser?.role === "Arrendador" && (
        <ContractFormDialog
          contract={editingContract}
          open={isContractFormOpen}
          onOpenChange={setIsContractFormOpen}
          onSave={handleSaveContract}
          availableProperties={landlordProperties}
        />
      )}
      
      {contractToApprove && ( 
        <ContractApprovalDialog
          contract={contractToApprove}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          onApprove={() => handleApprovalAction(contractToApprove.id, "Activo")}
          onReject={() => handleApprovalAction(contractToApprove.id, "Rechazado")}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
