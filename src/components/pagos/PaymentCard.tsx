
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Payment, UserRole } from "@/types";
import { DollarSign, CalendarDays, Info, CheckCircle2, Clock, UserCircle, Building, Paperclip } from "lucide-react";

interface PaymentCardProps {
  payment: Payment;
  userRole: UserRole | null;
  onAcceptPayment?: (paymentId: string, contractId: string) => void;
  isAcceptingPayment?: boolean;
}

export function PaymentCard({ payment, userRole, onAcceptPayment, isAcceptingPayment }: PaymentCardProps) {
  
  const getStatusVariant = (status: Payment["status"]) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-400 text-yellow-900";
      case "aceptado":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline capitalize">
            Pago de {payment.type}
          </CardTitle>
          <Badge className={`${getStatusVariant(payment.status)} text-xs`}>{payment.status}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
           Propiedad: {payment.propertyName || payment.propertyId.substring(0,8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Monto: ${payment.amount.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Fecha de Pago: {formatDate(payment.paymentDate)}</span>
        </div>
         {userRole === "Arrendador" && payment.tenantName && (
          <div className="flex items-center">
            <UserCircle className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span>Inquilino: {payment.tenantName}</span>
          </div>
        )}
        {userRole === "Inquilino" && payment.landlordName && (
          <div className="flex items-center">
            <UserCircle className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span>Arrendador: {payment.landlordName}</span>
          </div>
        )}
        {payment.notes && (
          <div className="flex items-start">
            <Info className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
            <span className="whitespace-pre-wrap">Notas: {payment.notes}</span>
          </div>
        )}
        {payment.attachmentUrl && (
          <div className="flex items-center">
            <Paperclip className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            {/* TODO: Make this a functional link once file upload is fully implemented */}
            <span>Comprobante: {payment.attachmentUrl}</span> 
          </div>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span>Declarado: {formatDateTime(payment.declaredAt)}</span>
        </div>
        {payment.status === "aceptado" && payment.acceptedAt && (
             <div className="flex items-center text-xs text-accent-foreground/80 bg-accent/20 p-1 rounded-sm">
                <CheckCircle2 className="h-3 w-3 mr-1.5 flex-shrink-0 text-accent" />
                <span>Aceptado: {formatDateTime(payment.acceptedAt)}</span>
            </div>
        )}
      </CardContent>
      {userRole === "Arrendador" && payment.status === "pendiente" && onAcceptPayment && (
        <CardFooter className="flex justify-end space-x-2 bg-muted/30 p-4 mt-auto">
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground" 
            size="sm" 
            onClick={() => onAcceptPayment(payment.id, payment.contractId)}
            disabled={isAcceptingPayment}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> 
            {isAcceptingPayment ? "Aceptando..." : "Aceptar Pago"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

