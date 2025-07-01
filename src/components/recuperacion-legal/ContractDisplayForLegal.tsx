
"use client";

import type { Contract, Property } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ContractDisplayForLegalProps {
  contract: Contract;
  property: Property | null;
}

export function ContractDisplayForLegal({ contract, property }: ContractDisplayForLegalProps) {
  if (!property) {
    return (
      <Alert variant="default" className="border-dashed">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Esperando detalles de la propiedad</AlertTitle>
        <AlertDescription>
          Cargando información adicional del inmueble para completar el documento.
        </AlertDescription>
      </Alert>
    );
  }

  const formatDate = (date: Date | string | undefined, options: Intl.DateTimeFormatOptions = {}): string => {
    if (!date) return "No especificada";
    try {
      return new Date(date).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric", ...options });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return "No especificado";
    return `$${amount.toLocaleString("es-CL")}`;
  };

  const calculateDurationInMonths = (startDateStr: string, endDateStr: string): number => {
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 12;
      let months = (end.getFullYear() - start.getFullYear()) * 12;
      months -= start.getMonth();
      months += end.getMonth();
      if (end.getDate() < start.getDate()) months--;
      return months <= 0 ? 1 : months;
    } catch {
      return 12;
    }
  };

  const cityAndCommune = `${property.comuna || 'comuna no especificada'}, ${property.region || 'región no especificada'}`;
  const fullAddress = `${property.address}, ${cityAndCommune}`;
  const contractDuration = calculateDurationInMonths(contract.startDate, contract.endDate);

  const getUsageClause = () => {
    switch (contract.propertyUsage) {
      case "Habitacional":
        return "El inmueble objeto de este contrato será destinado exclusivamente a la habitación del Arrendatario y su familia, quedando prohibido subarrendar, ceder o transferir a cualquier título el presente contrato.";
      case "Comercial":
        return "El inmueble objeto de este contrato será destinado exclusivamente al giro comercial declarado por el Arrendatario, quedando prohibido el cambio de rubro, subarrendar, ceder o transferir a cualquier título el presente contrato sin la autorización expresa y por escrito del Arrendador.";
      default:
        return "El destino de la propiedad no ha sido especificado. Queda prohibido subarrendar, ceder o transferir a cualquier título el presente contrato.";
    }
  };

  return (
    <div className="p-8 border rounded-md bg-white shadow-lg font-serif text-gray-800 text-justify">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase">Contrato de Arrendamiento de Bien Inmueble</h1>
      </header>
      
      <p className="mb-6">
        En la ciudad de {cityAndCommune}, a {formatDate(new Date())}, entre don(a) <strong>{contract.landlordName || "Nombre de Arrendador no especificado"}</strong>, 
        de nacionalidad chilena, cédula de identidad número <strong>{property.ownerRut || "RUT no especificado"}</strong>, 
        con domicilio en {contract.landlordAddress || "dirección no especificada"}, en adelante "el Arrendador"; 
        y don(a) <strong>{contract.tenantName || "Nombre de Inquilino no especificado"}</strong>, 
        de nacionalidad chilena, cédula de identidad número <strong>{contract.tenantRut || "RUT no especificado"}</strong>, 
        con domicilio en {fullAddress}, en adelante "el Arrendatario", 
        se ha convenido en el siguiente contrato de arrendamiento.
      </p>

      <Separator className="my-6" />

      <div className="space-y-4">
        <p><strong>PRIMERO: PROPIEDAD ARRENDADA.</strong></p>
        <p>
          El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble ubicado en <strong>{fullAddress}</strong>, 
          que consiste en {property.type ? `un(a) ${property.type.toLowerCase()}` : "una vivienda"}. El Arrendatario declara conocer y aceptar el estado actual de la propiedad.
        </p>

        <p><strong>SEGUNDO: PLAZO.</strong></p>
        <p>
          El presente contrato de arrendamiento rige a contar del día <strong>{formatDate(contract.startDate)}</strong>, 
          por un plazo de {contractDuration} meses, terminando en consecuencia el día <strong>{formatDate(contract.endDate)}</strong>. 
          El contrato se renovará tácita y sucesivamente por períodos iguales, a menos que alguna de las partes manifieste su voluntad 
          de ponerle término mediante carta certificada enviada al domicilio de la otra parte con una antelación mínima de 60 días a la fecha de vencimiento.
        </p>

        <p><strong>TERCERO: RENTA.</strong></p>
        <p>
          La renta mensual de arrendamiento será la suma de <strong>{formatCurrency(contract.rentAmount)}</strong>, 
          que el Arrendatario se obliga a pagar por anticipado dentro de los primeros <strong>{contract.rentPaymentDay || 5}</strong> días de cada mes, 
          mediante transferencia electrónica a la cuenta que el Arrendador indique.
          El no pago oportuno constituirá al arrendatario en mora, aplicándose un interés equivalente al máximo convencional permitido.
        </p>

        <p><strong>CUARTO: GARANTÍA.</strong></p>
        <p>
          A la firma del presente contrato, el Arrendatario entrega al Arrendador la suma de <strong>{formatCurrency(contract.securityDepositAmount)}</strong>, 
          equivalente a un mes de renta, con el fin de garantizar la conservación de la propiedad y su restitución en el mismo estado en que la recibe, 
          y el cumplimiento de las demás obligaciones del contrato.
        </p>

        <p><strong>QUINTO: DESTINO DE LA PROPIEDAD.</strong></p>
        <p>{getUsageClause()}</p>
        
        <p><strong>SEXTO: OBLIGACIONES DEL ARRENDATARIO.</strong></p>
        <ul className="list-disc list-inside pl-4">
          <li>Pagar oportunamente la renta de arrendamiento.</li>
          <li>Mantener la propiedad en buen estado de conservación.</li>
          <li>Pagar puntualmente los consumos de servicios básicos.</li>
          <li>Permitir el acceso al Arrendador para inspeccionar la propiedad.</li>
        </ul>

        {contract.terms && (
          <>
            <p><strong>SÉPTIMO: CLÁUSULAS ADICIONALES.</strong></p>
            <div className="p-3 my-2 border rounded-md bg-gray-50 whitespace-pre-wrap">
              <p>{contract.terms}</p>
            </div>
          </>
        )}

        <p><strong>OCTAVO: DOMICILIO.</strong></p>
        <p>
          Para todos los efectos legales, las partes fijan su domicilio en la comuna y ciudad de {property.comuna || 'Santiago'}, 
          y se someten a la jurisdicción de sus Tribunales de Justicia.
        </p>
      </div>

      <Separator className="my-8" />
      
      <div className="grid grid-cols-2 gap-8 pt-16">
        <div className="text-center">
          <div className="border-t-2 border-gray-600 w-3/4 mx-auto pt-2">
            <p className="font-semibold">{contract.landlordName || "ARRENDADOR"}</p>
            <p>RUT: {property.ownerRut || "No especificado"}</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-gray-600 w-3/4 mx-auto pt-2">
            <p className="font-semibold">{contract.tenantName || "ARRENDATARIO"}</p>
            <p>RUT: {contract.tenantRut || "No especificado"}</p>
          </div>
        </div>
      </div>

      <footer className="mt-16 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          ID del Contrato: {contract.id}
        </p>
      </footer>
    </div>
  );
}
