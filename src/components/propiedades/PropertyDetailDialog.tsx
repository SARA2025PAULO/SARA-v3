"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, DollarSign, Bed, Bath, Ruler, Mail } from "lucide-react";

interface PropertyDetailDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailDialog({ property, open, onOpenChange }: PropertyDetailDialogProps) {
  if (!property) return null;

  const statusVariant = property.status === "Disponible" ? "bg-green-500 text-white" : property.status === "Arrendada" ? "bg-orange-400 text-orange-900" : "bg-gray-300 text-gray-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">{property.address}</DialogTitle>
          <DialogDescription>
            <Badge className={`${statusVariant} text-sm mt-1`}>{property.status}</Badge>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {property.imageUrl && (
            <div className="w-full h-64 rounded-lg overflow-hidden">
                <img src={property.imageUrl} alt={`Imagen de ${property.address}`} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="space-y-4">
            <p className="text-muted-foreground">{property.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <strong>Precio:</strong> ${property.price?.toLocaleString('es-CL') ?? 'No especificado'}
                </div>
                <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <strong>Habitaciones:</strong> {property.bedrooms ?? 'No especificado'}
                </div>
                <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary" />
                    <strong>Baños:</strong> {property.bathrooms ?? 'No especificado'}
                </div>
                <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <strong>Área:</strong> {property.area ? `${property.area} m²` : 'No especificado'}
                </div>
                 {property.potentialTenantEmail && (
                    <div className="flex items-center gap-2 md:col-span-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <strong>Potencial Inquilino:</strong> {property.potentialTenantEmail}
                    </div>
                )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
