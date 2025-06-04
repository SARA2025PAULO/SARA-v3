
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Incident, UserProfile, IncidentStatus } from "@/types"; // UserProfile for currentUser
import { AlertTriangle, MessageSquare, CheckCircle2, Eye, CalendarDays, UserCircle, Paperclip } from "lucide-react";

interface IncidentCardProps {
  incident: Incident;
  currentUser: UserProfile | null; // Pass current user to determine actions and display
  onRespond?: (incident: Incident) => void;
  onClose?: (incidentId: string) => void;
  isProcessing?: boolean; 
}

export function IncidentCard({ incident, currentUser, onRespond, onClose, isProcessing }: IncidentCardProps) {
  
  const getStatusVariant = (status: IncidentStatus) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-400 text-yellow-900";
      case "respondido":
        return "bg-blue-400 text-blue-900";
      case "cerrado":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const creatorIsLandlord = incident.createdBy === incident.landlordId;
  const creatorName = creatorIsLandlord ? (incident.landlordName || "Arrendador") : (incident.tenantName || "Inquilino");

  const responderName = incident.respondedBy 
    ? (incident.respondedBy === incident.landlordId ? (incident.landlordName || "Arrendador") : (incident.tenantName || "Inquilino")) 
    : "N/A";
  
  const closerName = incident.closedBy
    ? (incident.closedBy === incident.landlordId ? (incident.landlordName || "Arrendador") : (incident.tenantName || "Inquilino"))
    : "N/A";


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Incidente: {incident.type.charAt(0).toUpperCase() + incident.type.slice(1)}
          </CardTitle>
          <Badge className={`${getStatusVariant(incident.status)} text-xs`}>{incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
           Propiedad: {incident.propertyName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Creado: {formatDate(incident.createdAt)} por {creatorName}</span>
        </div>
        <p className="font-semibold">Descripción Inicial:</p>
        <p className="text-muted-foreground bg-muted/30 p-2 rounded-md whitespace-pre-wrap text-xs max-h-24 overflow-y-auto">{incident.description}</p>
        {incident.initialAttachmentUrl && (
            <p className="text-xs flex items-center"><Paperclip className="h-3 w-3 mr-1"/> Adjunto Creador: {incident.initialAttachmentUrl}</p>
        )}

        {incident.status !== "pendiente" && incident.responseText && (
            <div className="mt-3 pt-3 border-t border-border">
                <p className="font-semibold flex items-center"><MessageSquare className="h-4 w-4 mr-2 text-primary"/> Respuesta ({responderName} - {formatDate(incident.respondedAt)}):</p>
                <p className="text-muted-foreground bg-muted/30 p-2 rounded-md whitespace-pre-wrap text-xs max-h-24 overflow-y-auto">{incident.responseText}</p>
                {incident.responseAttachmentUrl && (
                     <p className="text-xs flex items-center"><Paperclip className="h-3 w-3 mr-1"/> Adjunto Respuesta: {incident.responseAttachmentUrl}</p>
                )}
            </div>
        )}
         {incident.status === "cerrado" && (
            <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold flex items-center text-accent-foreground/80"><CheckCircle2 className="h-4 w-4 mr-2 text-accent"/> Cerrado por {closerName} el {formatDate(incident.closedAt)}</p>
            </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end space-x-2 bg-muted/30 p-4 mt-auto">
        {/* Action buttons based on currentUser and incident state */}
        {currentUser && incident.status === "pendiente" && incident.createdBy !== currentUser.uid && onRespond && (
          <Button className="bg-primary hover:bg-primary/90" size="sm" onClick={() => onRespond(incident)} disabled={isProcessing}>
            <MessageSquare className="h-4 w-4 mr-1" /> Responder
          </Button>
        )}
        {currentUser && incident.status === "respondido" && incident.createdBy === currentUser.uid && onClose && (
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" size="sm" onClick={() => onClose(incident.id)} disabled={isProcessing}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> {isProcessing ? "Cerrando..." : "Marcar como Cerrado"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
