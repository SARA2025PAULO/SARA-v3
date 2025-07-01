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
import { 
  Building,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Ruler,
  Mail,
  Tag,
  User2,
  CalendarDays // For createdAt/updatedAt
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PropertyDetailDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailDialog({ property, open, onOpenChange }: PropertyDetailDialogProps) {
  if (!property) return null;

  const statusVariant = property.status === "Disponible" ? "bg-green-500 text-white" : property.status === "Arrendada" ? "bg-orange-400 text-orange-900" : "bg-gray-300 text-gray-700";

  const formatOptionalString = (value?: string | null) => value || 'No especificado';
  const formatOptionalNumber = (value?: number | null) => value !== undefined && value !== null ? value.toLocaleString('es-CL') : 'No especificado';
  const formatOptionalDate = (dateString?: string | Date) => {
    if (!dateString) return 'No especificado';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, "d 'de' LLLL 'de' yyyy", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return 'No especificado';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <p className="text-muted-foreground">{formatOptionalString(property.description)}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {property.code && (
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <strong>Código:</strong> {formatOptionalString(property.code)}
                    </div>
                )}
                {property.ownerRut && (
                    <div className="flex items-center gap-2">
                        <User2 className="h-5 w-5 text-primary" />
                        <strong>RUT Propietario:</strong> {formatOptionalString(property.ownerRut)}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <strong>Ubicación:</strong> {formatOptionalString(property.address)}, {formatOptionalString(property.comuna)}, {formatOptionalString(property.region)}
                </div>
                {property.type && (
                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        <strong>Tipo:</strong> {formatOptionalString(property.type)}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <strong>Precio:</strong> {formatCurrency(property.price)}
                </div>
                <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <strong>Área:</strong> {property.area ? `${property.area} m²` : 'No especificado'}
                </div>
                <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <strong>Habitaciones:</strong> {formatOptionalNumber(property.bedrooms)}
                </div>
                <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-primary" />
                    <strong>Baños:</strong> {formatOptionalNumber(property.bathrooms)}
                </div>
                 {property.potentialTenantEmail && (
                    <div className="flex items-center gap-2 md:col-span-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <strong>Potencial Inquilino:</strong> {formatOptionalString(property.potentialTenantEmail)}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                    <strong>Creado el:</strong> {formatOptionalDate(property.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                    <strong>Última actualización:</strong> {formatOptionalDate(property.updatedAt)}
                </div>
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
