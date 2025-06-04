
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Contract, UserRole, InitialPropertyStateStatus } from "@/types";
import { Eye, CheckCircle2, XCircle, Edit3, FileText, CalendarDays, User, Building, ShieldCheck, Receipt, Archive } from "lucide-react";

interface ContractCardProps {
  contract: Contract;
  userRole: UserRole | null;
  onViewDetails: (contract: Contract) => void;
  onApprove?: (contract: Contract) => void; // Tenant action
  onReject?: (contract: Contract) => void; // Tenant action
  onManage?: (contract: Contract) => void; // Landlord action
  onDeclareInitialState?: (contract: Contract) => void;
  onReviewInitialState?: (contract: Contract) => void;
}

export function ContractCard({
  contract,
  userRole,
  onViewDetails,
  onApprove,
  onReject,
  onManage,
  onDeclareInitialState,
  onReviewInitialState
}: ContractCardProps) {

  const getStatusVariant = (status: Contract["status"]) => {
    switch (status?.toLowerCase()) {
      case "pendiente":
        return "bg-yellow-400 text-yellow-900";
      case "aprobado":
      case "activo":
        return "bg-accent text-accent-foreground";
      case "rechazado":
      case "finalizado":
        return "bg-destructive/80 text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getInitialStateStatusText = (status?: InitialPropertyStateStatus) => {
    if (!status || status.toLowerCase() === "no_declarado") return null;
    const map: Record<string, string> = { // Allow any string as key for safety
      "no_declarado": "Sin Declarar",
      "pendiente_inquilino": "Estado Inicial Pendiente Inquilino",
      "aceptado_inquilino": "Estado Inicial Aceptado",
      "rechazado_inquilino": "Estado Inicial Rechazado",
    };
    return map[status.toLowerCase() as InitialPropertyStateStatus] || status;
  };

  const getInitialStateBadgeVariant = (status?: InitialPropertyStateStatus) => {
     if (!status || status.toLowerCase() === "no_declarado") return "invisible";
     switch (status.toLowerCase()) {
      case "pendiente_inquilino":
        return "bg-orange-400 text-orange-900";
      case "aceptado_inquilino":
        return "bg-green-500 text-white";
      case "rechazado_inquilino":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CL');

  const contractStatusLower = contract.status?.toLowerCase();
  const initialStatusLower = contract.initialPropertyStateStatus?.toLowerCase();

  // Simplified condition for showing "Declare Initial State" button
  const showDeclareInitialStateButton = 
    userRole?.toLowerCase() === "arrendador" &&
    (contractStatusLower === "activo" || contractStatusLower === "pendiente") &&
    !(initialStatusLower === "pendiente_inquilino" || 
      initialStatusLower === "aceptado_inquilino" || 
      initialStatusLower === "rechazado_inquilino");

  const showReviewInitialStateButton = 
    userRole?.toLowerCase() === "inquilino" &&
    initialStatusLower === "pendiente_inquilino";


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline">{contract.propertyName || `ID ${contract.propertyId.substring(0,8)}...`}</CardTitle>
          <Badge className={`${getStatusVariant(contract.status)} text-xs`}>{contract.status}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          {userRole?.toLowerCase() === "arrendador" ? `Inquilino: ${contract.tenantName || 'N/A'}` : `Arrendador: ${contract.landlordName || 'N/A'}`}
        </CardDescription>
         {contract.initialPropertyStateStatus && initialStatusLower !== "no_declarado" && (
          <Badge variant="outline" className={`mt-1 text-xs py-0.5 px-1.5 w-fit ${getInitialStateBadgeVariant(contract.initialPropertyStateStatus)}`}>
            {getInitialStateStatusText(contract.initialPropertyStateStatus)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Propiedad: {contract.propertyName || contract.propertyId}</span>
        </div>
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>{userRole?.toLowerCase() === "arrendador" ? `Inquilino: ${contract.tenantName || contract.tenantEmail}` : `Arrendador: ${contract.landlordName || contract.landlordId}`}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Duración: {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
        </div>
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Monto Arriendo: ${contract.rentAmount.toLocaleString('es-CL')}/mes</span>
        </div>
        {contract.securityDepositAmount !== undefined && (
          <div className="flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span>Garantía: ${contract.securityDepositAmount.toLocaleString('es-CL')}</span>
          </div>
        )}
        {contract.paymentDay && (
          <div className="flex items-center">
            <Receipt className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            <span>Día de Pago: {contract.paymentDay} de cada mes</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 bg-muted/30 p-4 mt-auto">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(contract)}>
          <Eye className="h-4 w-4 mr-1" /> Detalles
        </Button>
        {userRole?.toLowerCase() === "inquilino" && contract.status?.toLowerCase() === "pendiente" && onApprove && onReject && (
          <>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onReject(contract)}>
              <XCircle className="h-4 w-4 mr-1" /> Rechazar
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" onClick={() => onApprove(contract)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar Contrato
            </Button>
          </>
        )}
        {userRole?.toLowerCase() === "arrendador" && onManage && (
          <Button variant="default" size="sm" onClick={() => onManage(contract)}>
            <Edit3 className="h-4 w-4 mr-1" /> Gestionar Contrato
          </Button>
        )}
         {showDeclareInitialStateButton && onDeclareInitialState && (
          <Button variant="secondary" size="sm" onClick={() => onDeclareInitialState(contract)}>
            <Archive className="h-4 w-4 mr-1" /> Declarar Estado Inicial
          </Button>
        )}
        {showReviewInitialStateButton && onReviewInitialState && (
           <Button variant="secondary" size="sm" onClick={() => onReviewInitialState(contract)}>
            <Archive className="h-4 w-4 mr-1" /> Revisar Estado Inicial
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

    