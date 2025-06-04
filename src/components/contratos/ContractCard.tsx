"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Contract, UserRole } from "@/types";
import { Eye, CheckCircle2, XCircle, Edit3, FileText, CalendarDays, User, Building } from "lucide-react";

interface ContractCardProps {
  contract: Contract;
  userRole: UserRole | null;
  onViewDetails: (contract: Contract) => void;
  onApprove?: (contract: Contract) => void; // Tenant action
  onReject?: (contract: Contract) => void; // Tenant action
  onManage?: (contract: Contract) => void; // Landlord action
}

export function ContractCard({ contract, userRole, onViewDetails, onApprove, onReject, onManage }: ContractCardProps) {
  
  const getStatusVariant = (status: Contract["status"]) => {
    switch (status) {
      case "Pendiente":
        return "bg-yellow-400 text-yellow-900";
      case "Aprobado":
      case "Activo":
        return "bg-accent text-accent-foreground";
      case "Rechazado":
      case "Finalizado":
        return "bg-destructive/80 text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline">Contrato: {contract.propertyName || `ID ${contract.propertyId.substring(0,8)}...`}</CardTitle>
          <Badge className={`${getStatusVariant(contract.status)} text-xs`}>{contract.status}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {userRole === "Arrendador" ? `Inquilino: ${contract.tenantName || 'N/A'}` : `Arrendador: ${contract.landlordName || 'N/A'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary" />
          <span>Propiedad: {contract.propertyName || contract.propertyId}</span>
        </div>
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-primary" />
          <span>{userRole === "Arrendador" ? `Inquilino: ${contract.tenantName || contract.tenantId}` : `Arrendador: ${contract.landlordName || contract.landlordId}`}</span>
        </div>
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
          <span>Duración: {formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
        </div>
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-primary" />
          <span>Monto: ${contract.rentAmount.toLocaleString()}/mes</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-muted/30 p-4">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(contract)}>
          <Eye className="h-4 w-4 mr-1" /> Ver Detalles
        </Button>
        {userRole === "Inquilino" && contract.status === "Pendiente" && onApprove && onReject && (
          <>
            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onReject(contract)}>
              <XCircle className="h-4 w-4 mr-1" /> Rechazar
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" onClick={() => onApprove(contract)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Aprobar
            </Button>
          </>
        )}
        {userRole === "Arrendador" && onManage && (
          <Button variant="default" size="sm" onClick={() => onManage(contract)}>
            <Edit3 className="h-4 w-4 mr-1" /> Gestionar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
