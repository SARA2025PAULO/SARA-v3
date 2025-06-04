"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/propiedades/PropertyCard";
import { PropertyFormDialog } from "@/components/propiedades/PropertyFormDialog";
import type { Property } from "@/types";
import { PlusCircle, Search, LayoutGrid, List } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock Data - replace with actual data fetching (e.g., from Firestore)
const initialProperties: Property[] = [
  { id: "1", address: "Avenida Rivadavia 1234, Buenos Aires", status: "Disponible", description: "Amplio departamento de 3 ambientes con balcón.", ownerId: "landlord123", price: 750, bedrooms: 2, bathrooms: 1, area: 70, imageUrl: "https://placehold.co/600x400.png?text=Depto+Rivadavia" },
  { id: "2", address: "Calle Falsa 123, Springfield", status: "Arrendada", description: "Casa familiar con jardín y pileta.", ownerId: "landlord123", price: 1200, bedrooms: 3, bathrooms: 2, area: 150, imageUrl: "https://placehold.co/600x400.png?text=Casa+Springfield" },
  { id: "3", address: "Boulevard de los Sueños Rotos 45, Ciudad Gótica", status: "Mantenimiento", description: "Loft moderno en zona industrial renovada.", ownerId: "landlord123", price: 900, bedrooms: 1, bathrooms: 1, area: 90, imageUrl: "https://placehold.co/600x400.png?text=Loft+Gotica" },
];

export default function PropiedadesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");


  useEffect(() => {
    // Simulate fetching properties for the current landlord
    if (currentUser && currentUser.role === "Arrendador") {
      // In a real app, filter by currentUser.uid === property.ownerId
      const landlordProperties = initialProperties.filter(p => p.ownerId === currentUser.uid || initialProperties.indexOf(p) < 3); // Mocking some ownership
      setProperties(landlordProperties);
    } else {
       // Fallback for testing if currentUser is not Arrendador, or to show some initial data
       // This part would not be hit if layout correctly restricts access
       setProperties(initialProperties.slice(0,2));
    }
    setIsLoading(false);
  }, [currentUser]);
  
  // Handle new property or edit property through dialog
  const handleSaveProperty = (propertyData: Property, isEditing: boolean) => {
    // Here you would typically interact with your backend/Firestore
    if (isEditing) {
      setProperties(prev => prev.map(p => p.id === propertyData.id ? propertyData : p));
      toast({ title: "Propiedad Actualizada", description: `Los detalles de "${propertyData.address}" se han guardado.`});
    } else {
      setProperties(prev => [propertyData, ...prev]);
      toast({ title: "Propiedad Añadida", description: `"${propertyData.address}" se ha añadido a tus propiedades.`});
    }
    setEditingProperty(null);
    setIsFormOpen(false);
  };

  const handleAddNewProperty = () => {
    setEditingProperty(null);
    setIsFormOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsFormOpen(true);
  };

  const handleViewDetails = (property: Property) => {
    // For now, just log. Could open a more detailed modal or navigate to a property page.
    console.log("View details for:", property);
    toast({ title: "Vista de Detalles", description: `Mostrando detalles para ${property.address} (funcionalidad pendiente).`});
  };

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-4">Cargando propiedades...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Mis Propiedades</h1>
        <Button onClick={handleAddNewProperty} size="lg">
          <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Propiedad
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar por dirección o descripción..." 
            className="pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="grid"><LayoutGrid className="h-5 w-5" /></TabsTrigger>
            <TabsTrigger value="list"><List className="h-5 w-5" /></TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredProperties.length === 0 && !isLoading ? (
        <div className="text-center py-10">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No se encontraron propiedades</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Intenta con otros términos de búsqueda o " : "Comienza por "}
            <Button variant="link" className="p-0 h-auto" onClick={handleAddNewProperty}>añadir una nueva propiedad</Button>.
          </p>
        </div>
      ) : (
        <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"}>
          {filteredProperties.map((property) => (
             viewMode === "grid" ? (
                <PropertyCard
                    key={property.id}
                    property={property}
                    onEdit={handleEditProperty}
                    onViewDetails={handleViewDetails}
                />
             ) : (
                <Card key={property.id} className="flex flex-col md:flex-row overflow-hidden">
                    <img src={property.imageUrl || "https://placehold.co/200x150.png"} alt={property.address} className="w-full md:w-48 h-48 md:h-auto object-cover" data-ai-hint="property exterior" />
                    <div className="p-4 flex flex-col flex-grow">
                        <CardTitle className="text-lg font-semibold mb-1">{property.address}</CardTitle>
                        <Badge className={`w-fit text-xs mb-2 ${property.status === "Disponible" ? "bg-accent text-accent-foreground" : property.status === "Arrendada" ? "bg-blue-200 text-blue-800" : "bg-yellow-200 text-yellow-800"}`}>
                            {property.status}
                        </Badge>
                        <CardDescription className="text-sm text-muted-foreground mb-2 flex-grow">{property.description.substring(0,100)}{property.description.length > 100 && '...'}</CardDescription>
                         <div className="text-sm text-primary font-medium mb-2">${property.price?.toLocaleString() || 'N/A'}/mes</div>
                        <div className="flex justify-end space-x-2 mt-auto">
                            <Button variant="outline" size="sm" onClick={() => handleEditProperty(property)}><Edit3 className="h-4 w-4 mr-1" /> Editar</Button>
                            <Button variant="default" size="sm" onClick={() => onViewDetails(property)}><Eye className="h-4 w-4 mr-1" /> Detalles</Button>
                        </div>
                    </div>
                </Card>
             )
          ))}
        </div>
      )}

      <PropertyFormDialog
        property={editingProperty}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveProperty}
      />
    </div>
  );
}

// Helper to create a placeholder Building2 icon
const Building2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  </svg>
);
