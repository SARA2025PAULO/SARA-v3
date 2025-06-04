
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog, type PaymentFormValues } from "@/components/pagos/PaymentFormDialog";
import { PaymentCard } from "@/components/pagos/PaymentCard";
import type { Payment, Contract } from "@/types";
import { PlusCircle, Search, CreditCard } from "lucide-react"; // Removed ListChecks
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
        // For landlords, query the 'payments' collection group
        q = query(collectionGroup(db, "payments"), where("landlordId", "==", currentUser.uid), orderBy("declaredAt", "desc"));
      } else if (currentUser.role === "Inquilino") {
        // For tenants, also query the 'payments' collection group
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
      const selectedContract = tenantActiveContracts.find(c => c.id === values.contractId);
      if (!selectedContract) {
        toast({ title: "Error", description: "Contrato seleccionado no válido.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      let attachmentUrlValue: string | undefined = undefined;
      if (values.attachment && values.attachment.length > 0) {
        const file = values.attachment[0];
        // TODO: Implement Firebase Storage upload here
        // For now, using filename as placeholder
        attachmentUrlValue = file.name; 
        console.log("Attachment selected:", file.name, file.type);
        // Example (needs Firebase Storage setup & SDK):
        // const storage = getStorage();
        // const storageRef = ref(storage, `payment_proofs/${currentUser.uid}/${selectedContract.id}/${file.name}`);
        // await uploadBytes(storageRef, file);
        // attachmentUrlValue = await getDownloadURL(storageRef);
      }

      const paymentData: Omit<Payment, 'id' | 'declaredAt' | 'acceptedAt'> & { declaredAt: any } = {
        contractId: selectedContract.id,
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
        ...(attachmentUrlValue && { attachmentUrl: attachmentUrlValue }), // Add if attachment exists
      };
      
      const paymentsCollectionRef = collection(db, "contracts", selectedContract.id, "payments");
      await addDoc(paymentsCollectionRef, paymentData);
      
      toast({ title: "Pago Declarado", description: `Tu pago de ${values.type} por $${values.amount.toLocaleString('es-CL')} ha sido declarado.` });
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
        <h1 className="text-3xl font-bold font-headline">Gestión de Pagos</h1>
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

      {filteredPayments.length === 0 ? (
        <div className="text-center py-10">
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              userRole={userRole || null}
              onAcceptPayment={userRole === "Arrendador" && payment.status === "pendiente" ? handleAcceptPayment : undefined}
              isAcceptingPayment={isAccepting}
            />
          ))}
        </div>
      )}

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

