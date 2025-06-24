"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Property, UserRole } from "@/types";
import { Building, MapPin, Edit3, Trash2 } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  userRole: UserRole | null;
  onViewDetails?: (property: Property) => void;
  onManage?: (property: Property) => void;
  onDelete?: (property: Property) => void; 
}

export function PropertyCard({
  property,
  userRole,
  onViewDetails,
  onManage,
  onDelete,
}: PropertyCardProps) {

  const statusVariant = property.status === "Disponible" ? "bg-green-500 text-white" : property.status === "Arrendada" ? "bg-orange-400 text-orange-900" : "bg-gray-300 text-gray-700";

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold font-headline">{property.address}</CardTitle>
          <Badge className={`${statusVariant} text-xs`}>{property.status}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          {property.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm flex-grow">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>{property.address}</span>
        </div>
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Habitaciones: {property.bedrooms || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Baños: {property.bathrooms || 'N/A'}</span>
        </div>
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Área: {property.area || 'N/A'} m2</span>
        </div>
        <div className="flex items-center">
          <Building className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
          <span>Precio: ${property.price?.toLocaleString('es-CL')}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/30 p-4 mt-auto">
         {onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(property)}>
            Ver Detalles
          </Button>
        )}
        {userRole?.toLowerCase() === "arrendador" && onManage && (
          <Button variant="default" size="sm" onClick={() => onManage(property)}>
            <Edit3 className="h-4 w-4 mr-1" /> Gestionar
          </Button>
        )}
        {userRole?.toLowerCase() === "arrendador" && onDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(property)}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
