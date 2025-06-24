"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Contract, UserRole } from "@/types"; // NEW: Import UserRole
import { Home, User2, Landmark, Mail, CalendarDays, Paperclip, MessageSquare, Send } from "lucide-react"; // NEW: Added Send icon
import { Textarea } from "@/components/ui/textarea"; // NEW: Import Textarea
import { useAuth } from "@/contexts/AuthContext"; // NEW: Import useAuth
import { useToast } from "@/hooks/use-toast"; // NEW: Import useToast
import { useForm } from "react-hook-form"; // NEW: Import useForm
import { zodResolver } from "@hookform/resolvers/zod"; // NEW: Import zodResolver
import * as z from "zod"; // NEW: Import z
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"; // NEW: Import Form components

const responseFormSchema = z.object({
  responseText: z
    .string()
    .min(10, { message: "La respuesta debe tener al menos 10 caracteres." })
    .max(500, { message: "La respuesta no puede exceder los 500 caracteres." }),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

interface ContractDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract;
  currentUserRole: UserRole | null; // NEW: Pass current user role
  onRespondToObservation: (contractId: string, response: string) => Promise<void>; // NEW: Handler for response
  isSubmittingResponse: boolean; // NEW: To disable button while submitting
}

export function ContractDetailDialog({
  open,
  onOpenChange,
  contract,
  currentUserRole,
  onRespondToObservation,
  isSubmittingResponse,
}: ContractDetailDialogProps) {
  const { toast } = useToast();
  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      responseText: "",
    },
  });

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "PPP", { locale: es });
  };

  const formatDateTime = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "PPP p", { locale: es });
  };

  const formatOptionalString = (value?: string | null) => value || 'N/A';
  const formatOptionalNumber = (value?: number | null) => value !== undefined && value !== null ? value.toLocaleString('es-CL') : 'N/A';

  const handleResponseSubmit = async (values: ResponseFormValues) => {
    await onRespondToObservation(contract.id, values.responseText);
    form.reset(); // Reset form after saving
    // Dialog remains open, as per requirement, user closes manually
  };

  const showResponseForm = currentUserRole === "Arrendador" && contract.status?.toLowerCase() === "pendiente";

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
          
          {/* Seccion Contrato Existente Adjunto */}
          {contract.existingContractUrl && (
            <>
              <Separator />
              <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><Paperclip className="w-5 h-5 mr-2 text-primary" />Contrato Existente Adjunto</h4>
              <div className="text-sm">
                <Button variant="ghost" size="sm" asChild>
                  <a href={contract.existingContractUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700">
                    <Paperclip className="h-4 w-4 mr-1" /> {contract.existingContractFileName || 'Ver Contrato Adjunto'}
                  </a>
                </Button>
              </div>
            </>
          )}

          {/* Seccion Observaciones */}
          {(contract.observations && contract.observations.length > 0) && (
            <>
              <Separator />
              <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><MessageSquare className="w-5 h-5 mr-2 text-primary" />Observaciones y Respuestas</h4>
              <div className="space-y-4">
                {contract.observations.map((obs) => (
                  <div key={obs.id} className={`border-l-4 ${obs.type === 'observation' ? 'border-yellow-500' : 'border-blue-500'} pl-3 py-1 shadow-sm rounded-r-md bg-muted/20`}>
                    <p className="text-sm text-muted-foreground font-semibold">De: {obs.fromUserName} ({obs.fromUserRole}) el {formatDateTime(obs.createdAt)}</p>
                    <p className="text-sm text-foreground mt-1">{obs.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* NEW: Sección de Respuesta para Arrendador */}
          {showResponseForm && (
            <>
              <Separator />
              <h4 className="font-semibold text-lg flex items-center mb-2 mt-4"><Send className="w-5 h-5 mr-2 text-primary" />Responder Observación</h4>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleResponseSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="responseText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu Respuesta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmittingResponse}>
                    {isSubmittingResponse ? "Enviando..." : "Enviar Respuesta"}
                  </Button>
                </form>
              </Form>
            </>
          )}

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