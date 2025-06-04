
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog, type PaymentFormValues } from "@/components/pagos/PaymentFormDialog";
// PaymentCard is no longer directly used for list display, but kept for potential future detail view
// import { PaymentCard } from "@/components/pagos/PaymentCard"; 
import type { Payment, Contract } from "@/types";
import { PlusCircle, Search, CreditCard, CheckCircle2, Eye, AlertCircle } from "lucide-react";
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
  collectionGroup,
  getDoc
} from "firebase/firestore";
import { getDate } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function PagosPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenantActiveContracts, setTenantActiveContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form dialog
  const [isAccepting, setIsAccepting] = useState(false); // For accepting payment

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | Payment["status"]>("todos");

  const fetchTenantActiveContracts = useCallback(async () => {
    if (currentUser?.role === "Inquilino" && db) {
      try {
        const contractsRef = collection(db, "contracts");
        const q = query(contractsRef, 
          where("tenantId", "==", currentUser.uid),
          where("status", "==", "Activo") 
        );
        const contractsSnapshot = await getDocs(q);
        const fetchedContracts = contractsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Contract));
        setTenantActiveContracts(fetchedContracts);
      } catch (error) {
        console.error("Error fetching tenant's active contracts:", error);
        toast({ title: "Error", description: "No se pudieron cargar tus contratos activos.", variant: "destructive" });
      }
    }
  }, [currentUser, toast]);

  const fetchPayments = useCallback(async () => {
    if (!currentUser || !db) {
      setIsLoading(false);
      setPayments([]);
      return;
    }
    setIsLoading(true);
    try {
      let q;
      if (currentUser.role === "Arrendador") {
        q = query(collectionGroup(db, "payments"), where("landlordId", "==", currentUser.uid), orderBy("declaredAt", "desc"));
      } else if (currentUser.role === "Inquilino") {
        q = query(collectionGroup(db, "payments"), where("tenantId", "==", currentUser.uid), orderBy("declaredAt", "desc"));
      } else {
        setPayments([]);
        setIsLoading(false);
        return;
      }
      const querySnapshot = await getDocs(q);
      const fetchedPayments = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          paymentDate: data.paymentDate, 
          declaredAt: data.declaredAt?.toDate ? data.declaredAt.toDate().toISOString() : data.declaredAt,
          acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate().toISOString() : data.acceptedAt,
        } as Payment;
      });
      setPayments(fetchedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({ title: "Error al Cargar Pagos", description: "No se pudieron obtener los pagos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchPayments();
    if (currentUser?.role === "Inquilino") {
      fetchTenantActiveContracts();
    }
  }, [currentUser, fetchPayments, fetchTenantActiveContracts]);

  const handleDeclarePayment = async (values: PaymentFormValues) => {
    if (!currentUser || currentUser.role !== "Inquilino" || !db) {
      toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
      return;
    }
    if (!values.contractId) {
        toast({ title: "Error", description: "Debe seleccionar un contrato.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    try {
      const selectedContractDocRef = doc(db, "contracts", values.contractId);
      const selectedContractSnap = await getDoc(selectedContractDocRef);

      if (!selectedContractSnap.exists()) {
        toast({ title: "Error", description: "Contrato seleccionado no válido o no encontrado.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const selectedContract = selectedContractSnap.data() as Contract;

      let attachmentUrlValue: string | undefined = undefined;
      if (values.attachment && values.attachment.length > 0) {
        const file = values.attachment[0];
        // TODO: Implement Firebase Storage upload here
        attachmentUrlValue = file.name; 
      }

      let isOverdue = false;
      if (selectedContract.paymentDay) {
        const paymentDateDay = getDate(new Date(values.paymentDate));
        if (paymentDateDay > selectedContract.paymentDay) {
          isOverdue = true;
        }
      }

      const paymentData: Omit<Payment, 'id' | 'declaredAt' | 'acceptedAt'> & { declaredAt: any } = {
        contractId: selectedContractDocRef.id,
        propertyId: selectedContract.propertyId,
        propertyName: selectedContract.propertyName,
        tenantId: currentUser.uid,
        tenantName: currentUser.displayName,
        landlordId: selectedContract.landlordId,
        landlordName: selectedContract.landlordName,
        type: values.type,
        amount: values.amount,
        paymentDate: values.paymentDate.toISOString(),
        notes: values.notes || "",
        status: "pendiente",
        declaredBy: currentUser.uid,
        declaredAt: serverTimestamp(),
        ...(attachmentUrlValue && { attachmentUrl: attachmentUrlValue }),
        isOverdue,
      };
      
      const paymentsCollectionRef = collection(db, "contracts", selectedContractDocRef.id, "payments");
      await addDoc(paymentsCollectionRef, paymentData);
      
      toast({ title: "Pago Declarado", description: `Tu pago de ${values.type} por $${values.amount.toLocaleString('es-CL')} ha sido declarado.${isOverdue ? ' (Nota: Declarado fuera de plazo según día de pago del contrato)' : ''}` });
      fetchPayments(); 
      setIsPaymentFormOpen(false);
    } catch (error) {
      console.error("Error declaring payment:", error);
      toast({ title: "Error al Declarar Pago", description: "No se pudo guardar la declaración del pago.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptPayment = async (paymentId: string, contractId: string) => {
    if (!currentUser || currentUser.role !== "Arrendador" || !db) {
        toast({ title: "Error de Permiso", description: "Acción no permitida.", variant: "destructive" });
        return;
    }
    setIsAccepting(true);
    try {
      const paymentDocRef = doc(db, "contracts", contractId, "payments", paymentId);
      await updateDoc(paymentDocRef, { 
        status: "aceptado",
        acceptedAt: serverTimestamp(),
      });
      toast({ 
        title: "Pago Aceptado", 
        description: "El pago ha sido marcado como aceptado.",
        className: "bg-accent text-accent-foreground",
      });
      fetchPayments();
    } catch (error) {
      console.error("Error accepting payment:", error);
      toast({ title: "Error", description: "No se pudo aceptar el pago.", variant: "destructive" });
    } finally {
      setIsAccepting(false);
    }
  };
    
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const getStatusBadgeVariant = (status: Payment["status"]) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "aceptado": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && payments.length === 0) return <div className="p-4">Cargando pagos...</div>;

  const paymentStatusOptions: (Payment["status"] | "todos")[] = ["todos", "pendiente", "aceptado"];
  const userRole = currentUser?.role;

  const filteredPayments = payments
    .filter(p => statusFilter === "todos" || p.status === statusFilter)
    .filter(p => 
      (p.propertyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.amount.toString().includes(searchTerm) ||
      (userRole === "Arrendador" && (p.tenantName || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userRole === "Inquilino" && (p.landlordName || "").toLowerCase().includes(searchTerm.toLowerCase()))
    );
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline flex items-center"><CreditCard className="mr-2 h-8 w-8 text-primary" />Gestión de Pagos</h1>
        {userRole === "Inquilino" && (
          <Button onClick={() => setIsPaymentFormOpen(true)} size="lg" disabled={isSubmitting || tenantActiveContracts.length === 0}>
            <PlusCircle className="mr-2 h-5 w-5" /> Declarar Nuevo Pago
          </Button>
        )}
         {userRole === "Inquilino" && tenantActiveContracts.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Debes tener un contrato activo para declarar pagos.</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card rounded-lg shadow">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por propiedad, tipo, monto, persona..." 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList className="overflow-x-auto whitespace-nowrap">
            {paymentStatusOptions.map(status => (
              <TabsTrigger key={status} value={status} className="capitalize px-3 py-1.5 text-sm">
                {status === "todos" ? "Todos" : status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-card p-4 rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Propiedad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Fecha Pago</TableHead>
              {userRole === "Arrendador" && <TableHead>Inquilino</TableHead>}
              {userRole === "Inquilino" && <TableHead>Arrendador</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead>Declarado</TableHead>
              <TableHead>Aceptado</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={userRole === "Arrendador" || userRole === "Inquilino" ? 9 : 8} className="text-center">
                  Cargando pagos...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={userRole === "Arrendador" || userRole === "Inquilino" ? 9 : 8} className="text-center py-10">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold">No se encontraron pagos</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "todos" ? "Intenta con otros filtros. " : ""}
                    {userRole === "Inquilino" && 
                      <Button variant="link" className="p-0 h-auto" onClick={() => setIsPaymentFormOpen(true)} disabled={tenantActiveContracts.length === 0}>
                        Declara un nuevo pago
                      </Button>
                    }
                    {userRole === "Arrendador" && "No hay pagos que coincidan con los filtros."}
                  </p>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.propertyName || payment.propertyId.substring(0,8)}</TableCell>
                <TableCell className="capitalize">{payment.type}</TableCell>
                <TableCell className="text-right">${payment.amount.toLocaleString('es-CL')}</TableCell>
                <TableCell>
                  {formatDate(payment.paymentDate)}
                  {payment.isOverdue && (
                    <Badge variant="destructive" className="ml-2 text-xs p-1">
                      <AlertCircle className="h-3 w-3 mr-1" />Atrasado
                    </Badge>
                  )}
                </TableCell>
                {userRole === "Arrendador" && <TableCell>{payment.tenantName || 'N/A'}</TableCell>}
                {userRole === "Inquilino" && <TableCell>{payment.landlordName || 'N/A'}</TableCell>}
                <TableCell>
                  <Badge variant="outline" className={`${getStatusBadgeVariant(payment.status)} capitalize`}>
                    {payment.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(payment.declaredAt)}</TableCell>
                <TableCell>{payment.status === 'aceptado' ? formatDateTime(payment.acceptedAt) : 'N/A'}</TableCell>
                <TableCell className="text-center">
                  {userRole === "Arrendador" && payment.status === "pendiente" && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleAcceptPayment(payment.id, payment.contractId)}
                      disabled={isAccepting}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> {isAccepting ? "Aceptando..." : "Aceptar"}
                    </Button>
                  )}
                   {/* <Button variant="ghost" size="sm" onClick={() => toast({ title: "Detalles de Pago", description: "Funcionalidad de vista detallada pendiente."})}>
                        <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button> */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {userRole === "Inquilino" && (
        <PaymentFormDialog
          open={isPaymentFormOpen}
          onOpenChange={setIsPaymentFormOpen}
          onSave={handleDeclarePayment}
          tenantContracts={tenantActiveContracts}
        />
      )}
    </div>
  );
}
