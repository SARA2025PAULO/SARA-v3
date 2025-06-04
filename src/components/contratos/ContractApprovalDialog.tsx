"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Contract } from "@/types";
import { FileText, CalendarDays, DollarSign, CheckCircle, XCircle } from "lucide-react";

interface ContractApprovalDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (contractId: string) => void;
  onReject: (contractId: string) => void;
}

export function ContractApprovalDialog({ contract, open, onOpenChange, onApprove, onReject }: ContractApprovalDialogProps) {
  if (!contract) return null;

  const handleApprove = () => {
    onApprove(contract.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject(contract.id);
    onOpenChange(false);
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline text-2xl">Revisar y Aprobar Contrato</AlertDialogTitle>
          <AlertDialogDescription>
            Por favor, revisa los detalles del contrato para la propiedad <span className="font-semibold">{contract.propertyName || contract.propertyId}</span> antes de tomar una decisión.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3 py-4 text-sm">
          <p className="flex items-center"><FileText className="h-4 w-4 mr-2 text-primary" /> <strong>Propiedad:</strong> {contract.propertyName || contract.propertyId}</p>
          <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2 text-primary" /> <strong>Periodo:</strong> {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
          <p className="flex items-center"><DollarSign className="h-4 w-4 mr-2 text-primary" /> <strong>Monto Mensual:</strong> ${contract.rentAmount.toLocaleString()}</p>
          {contract.landlordName && <p className="flex items-center"><strong>Arrendador:</strong> {contract.landlordName}</p>}
          {contract.terms && (
            <div>
              <p className="font-semibold mt-2">Términos Adicionales:</p>
              <p className="text-xs text-muted-foreground p-2 border rounded-md bg-muted/50 whitespace-pre-wrap">{contract.terms}</p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancelar</Button>
          </AlertDialogCancel>
          <Button variant="destructive" onClick={handleReject}>
            <XCircle className="h-4 w-4 mr-2" /> Rechazar Contrato
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleApprove}>
            <CheckCircle className="h-4 w-4 mr-2" /> Aprobar Contrato
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
