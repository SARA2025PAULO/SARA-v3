export type UserRole = "Arrendador" | "Inquilino" | "Administrador";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  rut?: string;
  phone?: string;
  address?: string;
}

export interface Property {
  id: string;
  address: string;
  status: "Disponible" | "Arrendada" | "Mantenimiento";
  description: string;
  ownerId: string;
  imageUrl?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  potentialTenantEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  region?: string;
  comuna?: string;
  type?: "Casa" | "Departamento";
}

export interface Contract {
  id: string;
  propertyId: string;
  propertyName: string;
  landlordId: string;
  landlordName: string;
  landlordEmail: string;
  tenantId?: string; // Could be undefined if tenant hasn't registered yet
  tenantEmail: string;
  tenantName: string;
  tenantRut: string;
  startDate: string; // ISO 8601 string
  endDate: string; // ISO 8601 string
  rentAmount: number;
  status: "pendiente" | "activo" | "finalizado" | "rechazado" | "aprobado";
  commonExpensesIncluded: "si" | "no" | "no aplica";
  
  // Updated payment days
  rentPaymentDay?: number; // Día de pago del arriendo
  commonExpensesPaymentDay?: number; // Día de pago de gastos comunes (si no están incluidos)
  utilitiesPaymentDay?: number; // Día de pago de cuentas de servicios

  securityDepositAmount?: number;
  paymentDay?: number; // Legacy field, can be removed later
  terms?: string;

  propertyAddress?: string;
  propertyRolAvaluo?: string;
  propertyCBRFojas?: string;
  propertyCBRNumero?: string;
  propertyCBRAno?: number;
  
  tenantNationality?: string;
  tenantCivilStatus?: string;
  tenantProfession?: string;
  tenantAddressForNotifications?: string;

  createdAt?: any;
  updatedAt?: any;
  approvedAt?: any;
  rejectedAt?: any;
  terminatedAt?: any;
  
  existingContractUrl?: string;
  existingContractFileName?: string;
  
  observations?: ContractObservation[];
}

export interface Payment {
  id: string;
  contractId: string;
  tenantId: string;
  landlordId: string;
  amount: number;
  paymentDate: string; // ISO string
  status: "pendiente" | "verificado" | "atrasado";
  proofUrl?: string; // URL to the payment proof
  createdAt: any;
  description: string;
}

export interface Incident {
  id: string;
  contractId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  createdBy: string; // UID of the user who created it
  title: string;
  description: string;
  status: "abierto" | "en progreso" | "resuelto" | "cerrado";
  createdAt: any;
  responses: IncidentResponse[];
}

export interface IncidentResponse {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export interface Evaluation {
  id: string;
  contractId: string;
  tenantId: string;
  landlordId: string;
  rating: number; // e.g., 1-5
  comment: string;
  createdAt: any;
}

export interface ContractObservation {
    id: string;
    type: "observation" | "response";
    fromUserId: string;
    fromUserName: string;
    fromUserRole: UserRole;
    text: string;
    createdAt: string; // ISO string
}

export interface Announcement {
  id?: string;
  recipientId: string; // UID of the user who should see this
  title: string;
  message: string;
  link: string; // e.g., "/contratos"
  read: boolean;
  createdAt: any; // serverTimestamp
}
