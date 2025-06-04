
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
import { FileText, CalendarDays, DollarSign, CheckCircle, XCircle, User } from "lucide-react";

interface ContractApprovalDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void; // Simplified, ID is known in parent
  onReject: () => void;  // Simplified, ID is known in parent
  isSubmitting?: boolean;
}

export function ContractApprovalDialog({ contract, open, onOpenChange, onApprove, onReject, isSubmitting }: ContractApprovalDialogProps) {
  if (!contract) return null;
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CL');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">Revisar Contrato</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, revisa los detalles del contrato para la propiedad <span className="font-semibold">{contract.propertyName || contract.propertyId}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4 text-sm">
          <p className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" /> <strong>Propiedad:</strong> {contract.propertyName || contract.propertyId}</p>
          <p className="flex items-center"><User className="h-4 w-4 mr-2 text-primary" /> <strong>Arrendador:</strong> {contract.landlordName || contract.landlordId}</p>
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" /> <strong>Periodo:</strong> {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
          <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-primary" /> <strong>Monto Mensual:</strong> ${contract.rentAmount.toLocaleString('es-CL')}</p>
          {contract.terms && (
            <div>
              <p className="font-semibold mt-2">Términos Adicionales:</p>
              <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">{contract.terms}</p>
            </div>
          )}
        </div>
        {contract.status === "Pendiente" && (
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
         {contract.status !== "Pendiente" && (
            <AlertDialogFooter>
                <AlertDialogCancel asChild><Button variant="outline">Cerrar</Button></AlertDialogCancel>
            </AlertDialogFooter>
         )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
