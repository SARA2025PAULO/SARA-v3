
export type UserRole = "Arrendador" | "Inquilino";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole | null; 
  displayName?: string; 
}

export type PropertyStatus = "Disponible" | "Arrendada" | "Mantenimiento";

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  description: string;
  ownerId: string; // UID of the Arrendador
  imageUrl?: string;
  price?: number; // Monthly rent
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // Square meters/feet
  createdAt?: string; // ISO date string from Timestamp
  updatedAt?: string; // ISO date string from Timestamp
}

export type ContractStatus = "Pendiente" | "Aprobado" | "Rechazado" | "Activo" | "Finalizado";

export interface Contract {
  id: string;
  propertyId: string;
  propertyName?: string; // Denormalized for easier display
  tenantId: string;
  tenantName?: string; // Denormalized
  landlordId: string;
  landlordName?: string; // Denormalized
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  rentAmount: number;
  status: ContractStatus;
  terms?: string; // Additional contract terms
  createdAt: string; // ISO date string
}
