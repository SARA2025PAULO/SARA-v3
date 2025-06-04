
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/propiedades/PropertyCard";
import { PropertyFormDialog, type PropertyFormValues } from "@/components/propiedades/PropertyFormDialog";
import type { Property } from "@/types";
import { PlusCircle, Search, LayoutGrid, List, Edit3, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, addDoc, getDocs, query, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    const fetchProperties = async () => {
      if (currentUser && currentUser.role === "Arrendador" && db) {
        setIsLoading(true);
        try {
          const propertiesCollectionRef = collection(db, "users", currentUser.uid, "properties");
          // const q = query(propertiesCollectionRef, orderBy("createdAt", "desc")); // Optional: order by creation date
          const q = query(propertiesCollectionRef);
          const querySnapshot = await getDocs(q);
          const fetchedProperties: Property[] = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              address: data.address,
              status: data.status,
              description: data.description,
              ownerId: data.ownerId,
              imageUrl: data.imageUrl,
              price: data.price,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              area: data.area,
              createdAt: data.createdAt?.toDate().toISOString(),
              updatedAt: data.updatedAt?.toDate().toISOString(),
            } as Property;
          });
          setProperties(fetchedProperties);
        } catch (error) {
          console.error("Error fetching properties:", error);
          toast({ title: "Error al Cargar Propiedades", description: "No se pudieron obtener tus propiedades de la base de datos.", variant: "destructive"});
        } finally {
          setIsLoading(false);
        }
      } else {
        setProperties([]); 
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [currentUser, toast]);
  
  const handleSaveProperty = async (
    values: PropertyFormValues,
    isEditing: boolean,
    originalPropertyId?: string
  ) => {
    if (!currentUser || !db || currentUser.role !== "Arrendador") {
      toast({ title: "Error de Permiso", description: "No tienes permiso para esta acción.", variant: "destructive"});
      return;
    }

    setIsLoading(true); 

    try {
      if (isEditing && originalPropertyId) {
        const propertyDocRef = doc(db, "users", currentUser.uid, "properties", originalPropertyId);
        const updatedPropertyData = {
          ...values,
          ownerId: currentUser.uid,
          updatedAt: serverTimestamp(),
        };
        await setDoc(propertyDocRef, updatedPropertyData, { merge: true });

        setProperties(prev => prev.map(p => 
          p.id === originalPropertyId 
            ? { ...p, ...values, updatedAt: new Date().toISOString() } 
            : p
        ));
        toast({ title: "Propiedad Actualizada", description: `Los detalles de "${values.address}" se han guardado.` });

      } else { 
        const propertiesCollectionRef = collection(db, "users", currentUser.uid, "properties");
        const newPropertyData = {
          ...values,
          ownerId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        const newDocRef = await addDoc(propertiesCollectionRef, newPropertyData);
        
        const newPropertyForState: Property = {
            ...values, // spread form values
            id: newDocRef.id,
            ownerId: currentUser.uid,
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(),
            // Ensure optional fields from PropertyFormValues are correctly typed for Property
            price: values.price ?? undefined,
            bedrooms: values.bedrooms ?? undefined,
            bathrooms: values.bathrooms ?? undefined,
            area: values.area ?? undefined,
            imageUrl: values.imageUrl ?? undefined,
        };
        setProperties(prev => [newPropertyForState, ...prev]);
        toast({ title: "Propiedad Añadida", description: `"${values.address}" se ha añadido a tus propiedades.` });
      }
    } catch (error) {
      console.error("Error saving property to Firestore:", error);
      toast({ title: "Error al Guardar", description: "No se pudo guardar la propiedad en la base de datos.", variant: "destructive" });
    } finally {
      setIsLoading(false); 
      setEditingProperty(null);
      setIsFormOpen(false);
    }
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
    console.log("View details for:", property);
    toast({ title: "Vista de Detalles", description: `Mostrando detalles para ${property.address} (funcionalidad pendiente).`});
  };

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && properties.length === 0) { // Show loading only on initial load or when saving
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
                <Card key={property.id} className="flex flex-col md:flex-row overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <img src={property.imageUrl || "https://placehold.co/200x150.png"} alt={property.address} className="w-full md:w-48 h-48 md:h-auto object-cover" data-ai-hint="property building" />
                    <div className="p-4 flex flex-col flex-grow">
                        <CardTitle className="text-lg font-semibold mb-1 font-headline">{property.address}</CardTitle>
                        <Badge variant="secondary" className={`w-fit text-xs mb-2 ${property.status === "Disponible" ? "bg-accent text-accent-foreground" : property.status === "Arrendada" ? "bg-blue-200 text-blue-800" : "bg-yellow-200 text-yellow-800"}`}>
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
