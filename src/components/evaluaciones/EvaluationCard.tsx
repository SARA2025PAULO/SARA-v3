
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Evaluation, UserRole, EvaluationCriteria } from "@/types";
import { ClipboardCheck, CheckSquare, MessageSquare, Star, CalendarDays, UserCircle } from "lucide-react";

interface EvaluationCardProps {
  evaluation: Evaluation;
  userRole: UserRole | null;
  onConfirmReception?: (evaluation: Evaluation) => void; // For Tenant
  isProcessing?: boolean;
}

const criteriaLabels: Record<keyof EvaluationCriteria, string> = {
  paymentPunctuality: "Puntualidad Pagos",
  propertyCare: "Cuidado Propiedad",
  communication: "Comunicación",
  generalBehavior: "Convivencia General",
};

export function EvaluationCard({ evaluation, userRole, onConfirmReception, isProcessing }: EvaluationCardProps) {
  
  const getStatusVariant = (status: Evaluation["status"]) => {
    switch (status) {
      case "pendiente de confirmacion":
        return "bg-yellow-400 text-yellow-900";
      case "recibida":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-primary" />
            Evaluación: {evaluation.propertyName}
          </CardTitle>
          <Badge className={`${getStatusVariant(evaluation.status)} text-xs capitalize`}>{evaluation.status}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          {userRole === "Arrendador" 
            ? `Inquilino: ${evaluation.tenantName || evaluation.tenantId.substring(0,8)}` 
            : `Arrendador: ${evaluation.landlordName || evaluation.landlordId.substring(0,8)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Fecha Evaluación: {formatDate(evaluation.evaluationDate)}</span>
        </div>
        
        <div className="space-y-1 pt-1">
            <p className="font-medium">Calificaciones:</p>
            {(Object.keys(criteriaLabels) as Array<keyof EvaluationCriteria>).map(key => (
                 <div key={key} className="flex justify-between items-center text-xs ml-2">
                    <span>{criteriaLabels[key]}:</span>
                    <div className="flex">
                        {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`h-3 w-3 ${evaluation.criteria[key] >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/50'}`} />
                        ))}
                        <span className="ml-1">({evaluation.criteria[key]}/5)</span>
                    </div>
                </div>
            ))}
        </div>

        {evaluation.status === "recibida" && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3 mr-1.5 flex-shrink-0 text-accent" />
              <span>Confirmada por inquilino: {formatDate(evaluation.tenantConfirmedAt)}</span>
            </div>
            {evaluation.tenantComment && (
              <div className="mt-1">
                <p className="font-medium text-xs flex items-center"><MessageSquare className="h-3 w-3 mr-1 text-primary"/> Comentario Inquilino:</p>
                <p className="text-muted-foreground bg-muted/30 p-1.5 rounded-md whitespace-pre-wrap text-xs">{evaluation.tenantComment}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {userRole === "Inquilino" && evaluation.status === "pendiente de confirmacion" && onConfirmReception && (
        <CardFooter className="flex justify-end space-x-2 bg-muted/30 p-4 mt-auto">
          <Button 
            className="bg-primary hover:bg-primary/90" 
            size="sm" 
            onClick={() => onConfirmReception(evaluation)}
            disabled={isProcessing}
          >
            <CheckSquare className="h-4 w-4 mr-1" /> 
            {isProcessing ? "Procesando..." : "Ver y Confirmar Recepción"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
