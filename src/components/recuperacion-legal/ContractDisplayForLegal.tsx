
"use client";

import type { Contract } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ContractDisplayForLegalProps {
  contract: Contract;
}

export function ContractDisplayForLegal({ contract }: ContractDisplayForLegalProps) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 border rounded-md bg-background shadow">
      <header className="text-center mb-6">
        <h1 className="text-xl font-semibold text-primary">COPIA DE CONTRATO DE ARRIENDO</h1>
        <p className="text-sm text-muted-foreground">
          Emitido el: {new Date().toLocaleDateString("es-CL", { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <section className="mb-4">
        <h2 className="text-lg font-medium mb-2 border-b pb-1">1. Partes Involucradas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold">Arrendador:</h3>
            <p>Nombre: {contract.landlordName || "No especificado"}</p>
            <p>ID: {contract.landlordId}</p>
          </div>
          <div>
            <h3 className="font-semibold">Inquilino (Arrendatario):</h3>
            <p>Nombre: {contract.tenantName || "No especificado"}</p>
            <p>Correo Electrónico: {contract.tenantEmail}</p>
            <p>ID: {contract.tenantId}</p>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-lg font-medium mb-2 border-b pb-1">2. Propiedad Arrendada</h2>
        <div className="text-sm">
          <p><strong>Dirección:</strong> {contract.propertyName || `ID de Propiedad: ${contract.propertyId}`}</p>
          {/* Aquí podrían ir más detalles de la propiedad si estuvieran en el contrato */}
        </div>
      </section>

      <section className="mb-4">
        <h2 className="text-lg font-medium mb-2 border-b pb-1">3. Términos del Contrato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Fecha de Inicio:</strong> {formatDate(contract.startDate)}</p>
            <p><strong>Fecha de Término:</strong> {formatDate(contract.endDate)}</p>
          </div>
          <div>
            <p><strong>Monto del Arriendo Mensual:</strong> ${contract.rentAmount.toLocaleString("es-CL")}</p>
            {contract.securityDepositAmount !== undefined && (
              <p><strong>Monto de la Garantía:</strong> ${contract.securityDepositAmount.toLocaleString("es-CL")}</p>
            )}
            {contract.paymentDay && (
              <p><strong>Día de Pago Mensual:</strong> {contract.paymentDay} de cada mes</p>
            )}
          </div>
        </div>
      </section>

      {contract.terms && (
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-2 border-b pb-1">4. Cláusulas Adicionales</h2>
          <div className="p-3 border rounded-md bg-muted/30 text-sm whitespace-pre-wrap">
            {contract.terms}
          </div>
        </section>
      )}

      <Separator className="my-6" />

      <section className="text-sm">
        <p className="mb-8">
          En {contract.propertyName?.split(',').pop()?.trim() || "la ciudad"}, a {new Date(contract.startDate).toLocaleDateString("es-CL", { day: "numeric"})} de {new Date(contract.startDate).toLocaleDateString("es-CL", { month: "long"})} de {new Date(contract.startDate).toLocaleDateString("es-CL", { year: "numeric"})}, las partes declaran haber leído y entendido los términos de este contrato de arriendo registrado en la plataforma S.A.R.A. y se comprometen a su cumplimiento.
        </p>
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <div className="border-t-2 border-foreground w-3/4 mx-auto pt-2">Firma Arrendador</div>
            <p className="mt-1">{contract.landlordName || contract.landlordId}</p>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-foreground w-3/4 mx-auto pt-2">Firma Inquilino</div>
            <p className="mt-1">{contract.tenantName || contract.tenantEmail}</p>
          </div>
        </div>
      </section>

      <footer className="mt-10 pt-4 border-t text-center">
        <p className="text-xs text-muted-foreground">
          Este documento es una representación del contrato registrado en la plataforma S.A.R.A.
          ID del Contrato: {contract.id}
        </p>
      </footer>
    </div>
  );
}
