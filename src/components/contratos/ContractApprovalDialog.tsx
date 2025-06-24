
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Contract } from "@/types";
import { FileText, CalendarDays, DollarSign, CheckCircle, XCircle, User, ShieldCheck, Receipt } from "lucide-react";

interface ContractApprovalDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void; 
  onReject: () => void;  
  isSubmitting?: boolean;
}

export function ContractApprovalDialog({ contract, open, onOpenChange, onApprove, onReject, isSubmitting }: ContractApprovalDialogProps) {
  if (!contract) return null;
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CL');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">Revisar Contrato</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, revisa los detalles del contrato para la propiedad <span className="font-semibold">{contract.propertyName || contract.propertyId}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
          <p className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Propiedad:</strong> {contract.propertyName || contract.propertyId}</p>
          <p className="flex items-center"><User className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Arrendador:</strong> {contract.landlordName || contract.landlordId}</p>
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Periodo:</strong> {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
          <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Monto Arriendo Mensual:</strong> ${contract.rentAmount.toLocaleString('es-CL')}</p>
          {contract.securityDepositAmount !== undefined && (
            <p className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Monto Garantía:</strong> ${contract.securityDepositAmount.toLocaleString('es-CL')}</p>
          )}
          {contract.paymentDay && (
             <p className="flex items-center"><Receipt className="h-4 w-4 mr-2 text-primary flex-shrink-0" /> <strong>Día de Pago:</strong> {contract.paymentDay} de cada mes</p>
          )}
          {contract.terms && (
            <div>
              <p className="font-semibold mt-2 mb-1">Términos Adicionales:</p>
              <div className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/50 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {contract.terms}
              </div>
            </div>
          )}
        </div>
        {contract.status?.toLowerCase() === "pendiente" && ( // FIX: Changed to lowercase comparison
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isSubmitting}>Cerrar</Button>
            </AlertDialogCancel>
            <Button variant="destructive" onClick={onReject} disabled={isSubmitting}>
              <XCircle className="h-4 w-4 mr-2" /> {isSubmitting ? "Rechazando..." : "Rechazar Contrato"}
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={onApprove} disabled={isSubmitting}>
              <CheckCircle className="h-4 w-4 mr-2" /> {isSubmitting ? "Aprobando..." : "Aprobar Contrato"}
            </Button>
          </AlertDialogFooter>
        )}
         {contract.status?.toLowerCase() !== "pendiente" && ( // FIX: Changed to lowercase comparison
            <AlertDialogFooter>
                <AlertDialogCancel asChild><Button variant="outline">Cerrar</Button></AlertDialogCancel>
            </AlertDialogFooter>
         )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
