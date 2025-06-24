"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Paperclip, CheckCircle2, AlertCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Payment, UserRole } from "@/types";

interface PaymentCardProps {
  payment: Payment;
  currentUserRole: UserRole | null;
  onAccept: (paymentId: string, contractId: string) => Promise<void>;
  isProcessing: boolean; 
}

export function PaymentCard({
  payment,
  currentUserRole,
  onAccept,
  isProcessing,
}: PaymentCardProps) {
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeVariant = (status: Payment["status"]) => {
    switch (status) {
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "aceptado": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>{payment.propertyName} - {payment.type}</span>
          <Badge className={`${getStatusBadgeVariant(payment.status)} capitalize text-sm`}>
            {payment.status}
          </Badge>
        </CardTitle>
        <CardDescription className="text-lg font-semibold text-primary">
          ${payment.amount.toLocaleString('es-CL')}
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          Fecha de Pago: {formatDate(payment.paymentDate)}
          {payment.isOverdue && (
            <Badge variant="destructive" className="ml-2 text-xs p-1">
              <AlertCircle className="h-3 w-3 mr-1" />Atrasado
            </Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {currentUserRole === "Arrendador" ? `Inquilino: ${payment.tenantName || 'N/A'}` : `Arrendador: ${payment.landlordName || 'N/A'}`}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm">Ver más detalles</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong className="block">Notas:</strong>
                  <p className="text-muted-foreground">{payment.notes || 'No hay notas.'}</p>
                </div>
                <div>
                  <strong className="block">Declarado:</strong>
                  <p className="text-muted-foreground">{formatDateTime(payment.declaredAt)}</p>
                </div>
                <div>
                  <strong className="block">Aceptado:</strong>
                  <p className="text-muted-foreground">{payment.status === 'aceptado' ? formatDateTime(payment.acceptedAt) : 'N/A'}</p>
                </div>
                {payment.attachmentUrl && (
                  <div>
                    <strong className="block">Comprobante:</strong>
                    <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
                      <a href={payment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                        <Paperclip className="h-4 w-4 mr-1" /> Ver Adjunto
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      {currentUserRole === "Arrendador" && payment.status === "pendiente" && (
        <div className="p-4 pt-0">
          <Button
            className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
            variant="outline"
            onClick={() => onAccept(payment.id, payment.contractId)}
            disabled={isProcessing}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> {isProcessing ? "Aceptando..." : "Aceptar Pago"}
          </Button>
        </div>
      )}
    </Card>
  );
}