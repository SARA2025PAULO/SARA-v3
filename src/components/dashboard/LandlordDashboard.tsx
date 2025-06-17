"use client";

import Link from "next/link";
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Assuming Button component is at this path
import { Building2, FileText, PlusCircle, Gavel, Upload } from "lucide-react"; // Import Upload icon
import type { Property, Contract, Payment } from "@/types";
import Image from "next/image";
import { AnnouncementsSection } from "./AnnouncementsSection";
import BulkUploadModal from "@/components/properties/BulkUploadModal"; // Import BulkUploadModal

// Import Firebase v9 functions
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { db } from "@/lib/firebase"; // Import the initialized db instance

// Mock data - REMOVED OR COMMENTED OUT
// const mockProperties: Property[] = [
//   { id: "1", address: "Av. Siempre Viva 742", status: "Arrendada", description: "Casa familiar", ownerId: "landlord1", price: 750000, imageUrl: "https://placehold.co/600x400.png" },
//   { id: "2", address: "Calle Falsa 123", status: "Disponible", description: "Apartamento moderno", ownerId: "landlord1", price: 450000, imageUrl: "https://placehold.co/600x400.png" },
// ];

const mockContracts: Contract[] = [
  { id: "c1", propertyId: "1", tenantId: "tenant1", landlordId: "landlord1", startDate: "2023-01-01", endDate: "2023-12-31", rentAmount: 750000, securityDepositAmount: 750000, paymentDay: 5, status: "Activo", propertyName: "Av. Siempre Viva 742", createdAt: "2023-01-01", tenantEmail: "tenant@example.com" },
];

const mockPayments: Payment[] = [
  { id: "p1", contractId: "c1", amount: 750000, date: "2023-02-05", status: "Pagado" },
  { id: "p2", contractId: "c1", amount: 750000, date: "2023-03-05", status: "Pagado" },
];

export function LandlordDashboard() {
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false); // State for modal visibility
  const [properties, setProperties] = useState<Property[]>([]); // State for fetched properties

  console.log('Rendering LandlordDashboard, isBulkUploadModalOpen:', isBulkUploadModalOpen); // Log state on render

  // Function to fetch properties from the 'propiedades' collection in Firestore
  const fetchProperties = async () => {
    console.log("Fetching properties from Firestore...");
    const propertiesCollection = collection(db, "propiedades");
    const propertySnapshot = await getDocs(propertiesCollection);
    const propertiesList = propertySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Property // Cast data to Property type (adjust if your Property type needs mapping)
    }));
    setProperties(propertiesList);
    console.log("Properties fetched:", propertiesList.length);
  };

  // Fetch properties when the component mounts
  useEffect(() => {
    fetchProperties();
  }, []); // Empty dependency array means this runs only once on mount

  // Pass fetchProperties as a callback to the modal
  const handleUploadSuccess = () => {
      fetchProperties(); // Refresh properties after successful upload
      // Optional: Close the modal automatically after successful upload
      // setIsBulkUploadModalOpen(false);
  };


  const totalProperties = properties.length;
  const totalPaymentsReceived = mockPayments.filter(p => p.status === "Pagado").reduce((sum, payment) => sum + payment.amount, 0);

  const activeContracts = mockContracts.filter(c => c.status === "Activo" || c.status === "Pendiente").length;

  return (
    <div className="space-y-6">
      <h2>Rol: Arrendador</h2> {/* Added H2 tag here */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/propiedades">
                <Building2 className="mr-2 h-5 w-5" /> Gestionar Propiedades
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/propiedades#nueva"> {/* This might need to trigger the dialog instead of hash */}
                <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nueva Propiedad
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos">
                <FileText className="mr-2 h-5 w-5" /> Ver Contratos
              </Link>
            </Button>
             <Button asChild className="w-full justify-start" size="lg">
              <Link href="/contratos#nuevo"> {/* This might need to trigger the dialog instead of hash */}
                <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Contrato
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" size="lg" variant="outline">
              <Link href="/dashboard/recuperacion-legal"> {/* Assuming this path is correct */}
                <Gavel className="mr-2 h-5 w-5" /> Recuperación Legal de Propiedad
              </Link>
            </Button>
             <Button className="w-full justify-start" size="lg" onClick={() => {
               setIsBulkUploadModalOpen(true);
               console.log('Carga Masiva button clicked, setting isBulkUploadModalOpen to true'); // Log on click
             }}>
              <Upload className="mr-2 h-5 w-5" /> Carga Masiva de Propiedades
            </Button> {/* Correctly closed Button tag here */}
          </CardContent>
        </Card>

        <AnnouncementsSection />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Resumen General</CardTitle>
          <CardDescription>Estadísticas de tus propiedades y contratos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">Propiedades registradas</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Recibidos (Total)</CardTitle>
              <FileText className="h-5 w-5 text-green-500" /> {/* Using FileText for now, could be a dollar sign */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPaymentsReceived.toLocaleString()}</div> {/* Format as currency */}
              <p className="text-xs text-muted-foreground">Suma de pagos marcados como 'Pagado'</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeContracts}</div>
              <p className="text-xs text-muted-foreground">Contratos vigentes o pendientes</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      {/* Render the Bulk Upload Modal */}
      <BulkUploadModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess} // Pass the refresh function
      />
    </div>
  );
}
