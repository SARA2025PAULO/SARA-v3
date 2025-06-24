"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Contract } from "@/types";
import { Home, User2, Landmark, Mail, Phone, CalendarDays, DollarSign, ShieldCheck, Receipt, Hash } from "lucide-react";

interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
}

export function ContractDetailDialog({
  open,
  onOpenChange,
  contract,
}: ContractDetailDialogProps) {
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    // Handle Firestore Timestamps if they come as objects (though they should be converted to ISO strings in fetch)
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "PPP", { locale: es });
  };

  const formatOptionalString = (value?: string | null) => value || 'N/A';
  const formatOptionalNumber = (value?: number | null) => value !== undefined && value !== null ? value.toLocaleString('es-CL') : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Contrato</DialogTitle>
          <DialogDescription>
            Información completa del contrato de arrendamiento.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          {/* Seccion Propiedad */}
          <h4 className="font-semibold text-lg flex items-center mb-2"><Home className="w-5 h-5 mr-2 text-primary" />Datos de la Propiedad</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="col-span-2"><strong>Propiedad:</strong> {formatOptionalString(contract.propertyName)} ({contract.propertyId.substring(0,8)}...)</div>
            <div><strong>Dirección:</strong> {formatOptionalString(contract.propertyAddress)}</div>
            <div><strong>Rol Avalúo:</strong> {formatOptionalString(contract.propertyRolAvaluo)}</div>
            <div><strong>Foja CBR:</strong> {formatOptionalString(contract.propertyCBRFojas)}</div>
            <div><strong>Número CBR:</strong> {formatOptionalString(contract.propertyCBRNumero)}</div>
            <div><strong>Año CBR:</strong> {formatOptionalNumber(contract.propertyCBRAno)}</div>
          </div>
          <Separator />

          {/* Seccion Inquilino */}
          <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><User2 className="w-5 h-5 mr-2 text-primary" />Datos del Inquilino</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><strong>Nombre:</strong> {formatOptionalString(contract.tenantName)}</div>
            <div><strong>RUT:</strong> {formatOptionalString(contract.tenantRut)}</div>
            <div><strong>Nacionalidad:</strong> {formatOptionalString(contract.tenantNationality)}</div>
            <div><strong>Estado Civil:</strong> {formatOptionalString(contract.tenantCivilStatus)}</div>
            <div><strong>Profesión:</strong> {formatOptionalString(contract.tenantProfession)}</div>
            <div className="col-span-2"><strong>Email:</strong> {formatOptionalString(contract.tenantEmail)}</div>
            <div className="col-span-2"><strong>Domicilio Notif.:</strong> {formatOptionalString(contract.tenantAddressForNotifications)}</div>
          </div>
          <Separator />

          {/* Seccion Arrendador */}
          <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><User2 className="w-5 h-5 mr-2 text-primary" />Datos del Arrendador</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><strong>Nombre:</strong> {formatOptionalString(contract.landlordName)}</div>
            <div className="col-span-2"><strong>Email:</strong> {formatOptionalString(contract.landlordEmail)}</div>
          </div>
          <Separator />

          {/* Seccion Términos del Contrato */}
          <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><Landmark className="w-5 h-5 mr-2 text-primary" />Términos del Contrato</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><strong>Inicio:</strong> {formatDate(contract.startDate)}</div>
            <div><strong>Fin:</strong> {formatDate(contract.endDate)}</div>
            <div><strong>Monto Arriendo:</strong> ${formatOptionalNumber(contract.rentAmount)} /mes</div>
            <div><strong>Gasto Comunes Inc.:</strong> {formatOptionalString(contract.commonExpensesIncluded)}</div>
            <div><strong>Monto Garantía:</strong> ${formatOptionalNumber(contract.securityDepositAmount)}</div>
            <div><strong>Día de Pago:</strong> {formatOptionalNumber(contract.paymentDay)}</div>
            <div className="col-span-2"><strong>Condiciones Adicionales:</strong> {formatOptionalString(contract.terms)}</div>
          </div>
          <Separator />

          {/* Seccion Fechas y Estado */}
          <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><CalendarDays className="w-5 h-5 mr-2 text-primary" />Estado y Fechas</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><strong>Estado:</strong> {formatOptionalString(contract.status)}</div>
            <div><strong>Estado Inicial Prop.:</strong> {formatOptionalString(contract.initialPropertyStateStatus)}</div>
            <div><strong>Creado el:</strong> {formatDate(contract.createdAt)}</div>
            <div><strong>Aprobado el:</strong> {formatDate(contract.approvedAt)}</div>
            <div><strong>Rechazado el:</strong> {formatDate(contract.rejectedAt)}</div>
            <div><strong>Finalizado el:</strong> {formatDate(contract.terminatedAt)}</div>
          </div>

        </div>
        <DialogClose asChild>
          <Button type="button" variant="secondary">Cerrar</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}