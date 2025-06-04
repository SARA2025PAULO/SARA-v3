"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ContractCard } from "@/components/contratos/ContractCard";
import { ContractFormDialog } from "@/components/contratos/ContractFormDialog";
import { ContractApprovalDialog } from "@/components/contratos/ContractApprovalDialog";
import type { Contract, Property } from "@/types";
import { PlusCircle, FileText, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";


// Mock Data - replace with actual data fetching
const initialContracts: Contract[] = [
  { id: "c1", propertyId: "p1", propertyName: "Avenida Rivadavia 1234", tenantId: "tenant001", tenantName: "Lisa Simpson", landlordId: "landlord123", landlordName: "Ned Flanders", startDate: "2024-01-15", endDate: "2025-01-14", rentAmount: 750, status: "Activo", createdAt: "2024-01-10" },
  { id: "c2", propertyId: "p2", propertyName: "Calle Falsa 123", tenantId: "tenant002", tenantName: "Bart Simpson", landlordId: "landlord123", landlordName: "Ned Flanders", startDate: "2024-03-01", endDate: "2025-02-28", rentAmount: 1200, status: "Pendiente", createdAt: "2024-02-20" },
  { id: "c3", propertyId: "p3", propertyName: "Loft Ciudad Gótica", tenantId: "tenant001", tenantName: "Lisa Simpson", landlordId: "anotherLord", landlordName: "Selina Kyle", startDate: "2023-11-01", endDate: "2024-10-31", rentAmount: 900, status: "Finalizado", createdAt: "2023-10-25" },
];

const mockProperties: Property[] = [ // For landlord to select when creating contract
  { id: "p1", address: "Avenida Rivadavia 1234, Buenos Aires", status: "Arrendada", description: "...", ownerId: "landlord123" },
  { id: "p4", address: "Avenida Corrientes 5678, Buenos Aires", status: "Disponible", description: "Moderno monoambiente céntrico.", ownerId: "landlord123", price: 500 },
  { id: "p5", address: "Calle Defensa 910, San Telmo", status: "Disponible", description: "PH antiguo reciclado con patio.", ownerId: "landlord123", price: 650 },
];


export default function ContratosPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null); // For editing existing contract
  
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [contractToApprove, setContractToApprove] = useState<Contract | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Contract["status"]>("todos");

  useEffect(() => {
    if (currentUser) {
      // Simulate fetching contracts based on user role
      if (currentUser.role === "Arrendador") {
        setContracts(initialContracts.filter(c => c.landlordId === currentUser.uid || initialContracts.indexOf(c) < 2)); // Mock
        setLandlordProperties(mockProperties.filter(p => p.ownerId === currentUser.uid || mockProperties.indexOf(p) > 0)); // Mock
      } else if (currentUser.role === "Inquilino") {
        setContracts(initialContracts.filter(c => c.tenantId === currentUser.uid || initialContracts.indexOf(c) % 2 === 0)); // Mock
      }
    } else {
      // Fallback if no user, show limited data for demo purposes
      setContracts(initialContracts.slice(0,1));
    }
    setIsLoading(false);
  }, [currentUser]);

  const handleSaveContract = (contractData: Contract, isEditingFlag: boolean) => {
    if (isEditingFlag) {
      setContracts(prev => prev.map(c => c.id === contractData.id ? contractData : c));
      toast({ title: "Contrato Actualizado", description: `El contrato para ${contractData.propertyName} ha sido guardado.` });
    } else {
      setContracts(prev => [contractData, ...prev]);
      toast({ title: "Contrato Creado", description: `Nuevo contrato para ${contractData.propertyName} está ${contractData.status}.` });
    }
    setEditingContract(null);
    setIsContractFormOpen(false);
  };

  const handleApproveContract = (contractId: string) => {
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: "Activo" } : c));
    toast({ title: "Contrato Aprobado", description: "El contrato ha sido marcado como activo.", className: "bg-accent text-accent-foreground" });
    setIsApprovalDialogOpen(false);
  };

  const handleRejectContract = (contractId: string) => {
    setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: "Rechazado" } : c));
    toast({ title: "Contrato Rechazado", variant: "destructive" });
    setIsApprovalDialogOpen(false);
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
      (currentUser?.role === "Arrendador" && (c.tenantName || c.tenantId).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (currentUser?.role === "Inquilino" && (c.landlordName || c.landlordId).toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
  if (isLoading) return <div className="p-4">Cargando contratos...</div>;

  const contractStatusOptions: (Contract["status"] | "todos")[] = ["todos", "Pendiente", "Activo", "Finalizado", "Rechazado", "Aprobado"];


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Gestión de Contratos</h1>
        {currentUser?.role === "Arrendador" && (
          <Button onClick={() => openContractFormDialog()} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
          </Button>
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
              onViewDetails={handleViewDetails}
              onApprove={currentUser?.role === "Inquilino" ? () => openApprovalDialog(contract) : undefined}
              onReject={currentUser?.role === "Inquilino" ? () => openApprovalDialog(contract) : undefined} // Using same dialog for reject for now
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
      
      {currentUser?.role === "Inquilino" && contractToApprove && (
        <ContractApprovalDialog
          contract={contractToApprove}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          onApprove={handleApproveContract}
          onReject={handleRejectContract}
        />
      )}
    </div>
  );
}
