
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Contract, Payment } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

interface PaymentHistoryCertificateProps {
  contract: Contract;
}

export function PaymentHistoryCertificate({ contract }: PaymentHistoryCertificateProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDeclared: 0,
    totalAccepted: 0,
    totalAmountAccepted: 0,
    totalOverdue: 0,
  });

  const fetchPayments = useCallback(async () => {
    if (!contract || !db) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const paymentsCollectionRef = collection(db, "contracts", contract.id, "payments");
      const q = query(paymentsCollectionRef, orderBy("paymentDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPayments = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          paymentDate: data.paymentDate, // Already ISO string from form
          declaredAt: data.declaredAt?.toDate ? data.declaredAt.toDate().toISOString() : data.declaredAt,
          acceptedAt: data.acceptedAt?.toDate ? data.acceptedAt.toDate().toISOString() : data.acceptedAt,
        } as Payment;
      });
      setPayments(fetchedPayments);

      let totalDeclared = fetchedPayments.length;
      let totalAccepted = 0;
      let totalAmountAccepted = 0;
      let totalOverdue = 0;

      fetchedPayments.forEach(p => {
        if (p.status === "aceptado") {
          totalAccepted++;
          totalAmountAccepted += p.amount;
        }
        if (p.isOverdue) {
          totalOverdue++;
        }
      });
      setSummary({ totalDeclared, totalAccepted, totalAmountAccepted, totalOverdue });

    } catch (error) {
      console.error("Error fetching payments for certificate:", error);
      // Consider adding a toast message here for the user
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
        return 'Fecha Inválida';
    }
  };
  
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
        return 'Fecha Inválida';
    }
  };

  const getStatusBadgeVariant = (status: Payment["status"]) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "aceptado": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center border rounded-md bg-background shadow mt-4"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> <p className="mt-2 text-muted-foreground">Cargando historial de pagos...</p></div>;
  }

  return (
    <div className="p-6 border rounded-md bg-background shadow mt-4 print:shadow-none print:border-none">
      <header className="text-center mb-8 print:mb-6">
        <h2 className="text-2xl font-bold text-primary font-headline">CERTIFICADO DE HISTORIAL DE PAGOS</h2>
        <p className="text-md text-muted-foreground mt-1">Contrato de Arriendo Propiedad: <span className="font-semibold">{contract.propertyName}</span></p>
        <p className="text-sm text-muted-foreground">Arrendador: {contract.landlordName || contract.landlordId}</p>
        <p className="text-sm text-muted-foreground">Inquilino: {contract.tenantName || contract.tenantEmail}</p>
        <p className="text-xs text-muted-foreground mt-2">Emitido el: {new Date().toLocaleDateString("es-CL", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <section className="mb-6 print:mb-4">
        <h3 className="text-lg font-semibold mb-3 border-b pb-1 text-primary/90">Resumen de Pagos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <p><strong>Total Pagos Declarados:</strong> {summary.totalDeclared}</p>
            <p><strong>Total Pagos Aceptados por Arrendador:</strong> {summary.totalAccepted}</p>
            <p><strong>Monto Total Aceptado:</strong> ${summary.totalAmountAccepted.toLocaleString('es-CL')}</p>
            <p><strong>Pagos Declarados con Atraso:</strong> {summary.totalOverdue} 
              {summary.totalDeclared > 0 && summary.totalOverdue > 0 && 
                <span className="text-xs text-destructive ml-1">({((summary.totalOverdue / summary.totalDeclared) * 100).toFixed(1)}%)</span>
              }
            </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold mb-3 border-b pb-1 text-primary/90">Detalle de Pagos Declarados por el Inquilino</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay pagos declarados para este contrato.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Pago</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto (CLP)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Atrasado</TableHead>
                  <TableHead>Declarado el</TableHead>
                  <TableHead>Aceptado el</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="capitalize">{payment.type}</TableCell>
                    <TableCell className="text-right">${payment.amount.toLocaleString('es-CL')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusBadgeVariant(payment.status)} capitalize text-xs`}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {payment.isOverdue ? 
                        <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1 inline-block"/>Sí</Badge> 
                        : <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">No</Badge>}
                    </TableCell>
                    <TableCell>{formatDateTime(payment.declaredAt)}</TableCell>
                    <TableCell>{payment.status === 'aceptado' && payment.acceptedAt ? formatDateTime(payment.acceptedAt) : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      <footer className="mt-12 pt-6 border-t text-center print:mt-8 print:pt-4">
        <p className="text-xs text-muted-foreground">
          Este historial se basa en la información de pagos registrada en la plataforma S.A.R.A para el contrato ID: {contract.id}.
        </p>
         <p className="text-xs text-muted-foreground mt-1">
          S.A.R.A. no verifica la validez de los comprobantes de pago ni garantiza la exactitud de las fechas de pago declaradas por los usuarios.
        </p>
      </footer>
    </div>
  );
}
