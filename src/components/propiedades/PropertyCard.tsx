"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/types";
import { Edit3, Eye, MapPin, DollarSign, BedDouble, Bath, Ruler } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onViewDetails: (property: Property) => void;
}

export function PropertyCard({ property, onEdit, onViewDetails }: PropertyCardProps) {
  const getStatusVariant = (status: Property["status"]) => {
    switch (status) {
      case "Disponible":
        return "bg-accent/80 hover:bg-accent text-accent-foreground"; // Using accent color for Disponible
      case "Arrendada":
        return "bg-blue-500 text-white"; // Using a distinct blue for Arrendada
      case "Mantenimiento":
        return "bg-yellow-500 text-white"; // Using yellow for Mantenimiento
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="p-0 relative">
        <Image
          src={property.imageUrl || "https://placehold.co/600x400.png"}
          alt={property.address}
          width={600}
          height={400}
          className="object-cover w-full h-48"
          data-ai-hint="house apartment building"
        />
        <Badge className={`absolute top-2 right-2 text-xs ${getStatusVariant(property.status)}`}>
          {property.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1 truncate font-headline">{property.address}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground h-10 overflow-hidden text-ellipsis">
          {property.description}
        </CardDescription>
        <div className="mt-3 space-y-1 text-sm text-foreground/80">
          {property.price && (
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-primary" />
              <span>${property.price.toLocaleString()}/mes</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
            {property.bedrooms && (
              <div className="flex items-center">
                <BedDouble className="h-4 w-4 mr-2 text-primary" />
                <span>{property.bedrooms} hab.</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-2 text-primary" />
                <span>{property.bathrooms} baños</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center col-span-2">
                <Ruler className="h-4 w-4 mr-2 text-primary" />
                <span>{property.area} m²</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(property)}>
          <Edit3 className="h-4 w-4 mr-1" /> Editar
        </Button>
        <Button variant="default" size="sm" onClick={() => onViewDetails(property)}>
          <Eye className="h-4 w-4 mr-1" /> Ver Detalles
        </Button>
      </CardFooter>
    </Card>
  );
}
