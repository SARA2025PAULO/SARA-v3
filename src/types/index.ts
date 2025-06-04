
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
  potentialTenantEmail?: string; // Email of a potential tenant, optional
  createdAt?: string; // ISO date string from Timestamp
  updatedAt?: string; // ISO date string from Timestamp
}

export type ContractStatus = "Pendiente" | "Aprobado" | "Rechazado" | "Activo" | "Finalizado";

export interface Contract {
  id: string; // Firestore document ID
  propertyId: string;
  propertyName?: string; // Denormalized for easier display
  tenantId: string; // UID of the Tenant user
  tenantEmail: string; // Email used by landlord to identify tenant
  tenantName?: string; // Denormalized, from tenant's profile or form input
  landlordId: string; // UID of the Landlord user
  landlordName?: string; // Denormalized, from landlord's profile
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  rentAmount: number;
  securityDepositAmount?: number; // Monto de la garantía, opcional
  paymentDay?: number; // Día del mes para el pago (1-31), opcional
  status: ContractStatus;
  terms?: string; // Additional contract terms
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string for when the contract was last updated
}

export type PaymentType = "arriendo" | "gastos comunes" | "reparaciones" | "otros";
export type PaymentStatus = "pendiente" | "aceptado";

export interface Payment {
  id: string; // Firestore document ID
  contractId: string;
  propertyId: string; // Denormalized from contract for easier querying by landlord
  propertyName?: string; // Denormalized from contract
  tenantId: string;
  tenantName?: string; // Denormalized
  landlordId: string;
  landlordName?: string; // Denormalized
  type: PaymentType;
  amount: number;
  paymentDate: string; // ISO string, date of the payment itself
  notes?: string;
  status: PaymentStatus;
  declaredAt: string; // ISO string, when tenant declared the payment
  acceptedAt?: string; // ISO string, when landlord accepted the payment
  declaredBy: string; // UID of tenant who declared
  attachmentUrl?: string; // Optional URL for payment proof
}
