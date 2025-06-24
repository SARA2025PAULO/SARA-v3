"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Property } from "@/types";
import {
  MapPin,
  Tag,
  User,
  Home,
  Ruler,
  DollarSign,
  FileText,
  Calendar,
  Building,
  Globe,
} from "lucide-react";

interface PropertyDetailDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailDialog({
  property,
  open,
  onOpenChange,
}: PropertyDetailDialogProps) {
  if (!property) return null;

  const getStatusVariant = (status: string | undefined) => {
    switch (status) {
      case "Disponible":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "Arrendada":
        return "bg-blue-500 hover:bg-blue-600 text-white";
      case "Mantenimiento":
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const DetailRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | number | null;
  }) => (
    <div className="flex items-start text-sm py-2 border-b border-muted/50">
      <Icon className="h-5 w-5 mr-3 mt-0.5 text-primary/80" />
      <div className="flex flex-col">
        <span className="font-semibold text-foreground/90">{label}</span>
        <span className="text-muted-foreground">
          {value || "No especificado"}
        </span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-headline flex items-center">
            <Building className="h-6 w-6 mr-2" />
            Detalles de la Propiedad
          </DialogTitle>
          <DialogDescription>
            Información completa de la propiedad registrada.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-1">
          <DetailRow
            icon={Tag}
            label="Código de Propiedad"
            value={property.propertyCode}
          />
          <DetailRow
            icon={User}
            label="Nombre del Propietario"
            value={property.ownerName}
          />
          <DetailRow
            icon={MapPin}
            label="Dirección"
            value={`${property.address}, ${property.comuna}`}
          />
          <DetailRow icon={Globe} label="Región" value={property.region} />
          <DetailRow
            icon={Home}
            label="Tipo de Propiedad"
            value={property.propertyType}
          />
          {property.m2 && (
            <DetailRow icon={Ruler} label="Metros Cuadrados" value={`${property.m2} m²`} />
          )}
          {property.price && (
            <DetailRow
              icon={DollarSign}
              label="Precio Mensual"
              value={`$${property.price.toLocaleString("es-CL")}`}
            />
          )}
          <div className="flex items-center text-sm py-2 border-b border-muted/50">
            <Calendar className="h-5 w-5 mr-3 text-primary/80" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground/90">Estado</span>
              <Badge className={`mt-1 w-fit ${getStatusVariant(property.status)}`}>
                {property.status}
              </Badge>
            </div>
          </div>
          <DetailRow
            icon={FileText}
            label="Descripción"
            value={property.description}
          />
        </div>
        <div className="flex justify-end pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline">Cerrar</Button>
            </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
