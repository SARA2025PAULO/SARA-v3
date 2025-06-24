export type UserRole = "Arrendador" | "Inquilino";

export interface UserProfile {
  uid: string;
  email: string | null;
  role: UserRole | null; 
  displayName?: string; 
  createdAt?: string; // ISO date string, from when the user was registered/profile created
}

export type PropertyStatus = "Disponible" | "Arrendada" | "Mantenimiento";

export interface Property {
  id: string;
  address: string;
  status: PropertyStatus;
  description: string;
  ownerId: string; // UID of the Arrendador
  imageUrl?: string;
  potentialTenantEmail?: string; // NEW: optional field for potential tenant email
  // Add other property details as needed, e.g., square meters, number of rooms, etc.
}

export type ContractStatus = "pendiente" | "aprobado" | "activo" | "rechazado" | "finalizado";
export type InitialPropertyStateStatus = "no_declarado" | "pendiente_inquilino" | "aceptado_inquilino" | "rechazado_inquilino";

export interface ContractObservation {
  id: string; // Unique ID for each observation/response
  type: "observation" | "response";
  fromUserId: string;
  fromUserName: string;
  fromUserRole: UserRole;
  text: string;
  createdAt: string; // ISO date string
}

export interface Contract {
  id: string;
  propertyId: string;
  propertyName?: string; // Denormalized for easier display
  propertyAddress?: string; // Denormalized for easier display
  propertyRolAvaluo?: string; // NEW: Rol de Avalúo Fiscal
  propertyCBRFojas?: string; // NEW: Foja de inscripción CBR
  propertyCBRNumero?: string; // NEW: Número de inscripción CBR
  propertyCBRAno?: number; // NEW: Año de inscripción CBR
  
  tenantId?: string; // UID of the Inquilino, once matched
  tenantEmail: string;
  tenantName?: string; // Denormalized
  tenantRut?: string; // NEW: RUT del Inquilino
  tenantNationality?: string; // NEW: Nacionalidad del Inquilino
  tenantCivilStatus?: string; // NEW: Estado Civil del Inquilino
  tenantProfession?: string; // NEW: Profesión u Oficio del Inquilino
  tenantAddressForNotifications?: string | null; // NEW: Domicilio para notificaciones

  landlordId: string; // UID of the Arrendador
  landlordName?: string; // Denormalized
  landlordEmail?: string; // Denormalized

  startDate: string; // ISO date string
  endDate: string; // ISO date string
  rentAmount: number;
  securityDepositAmount?: number; // Monto de la garantía
  commonExpensesIncluded?: "si" | "no" | "no aplica"; // NEW: Gastos Comunes Incluidos
  paymentDay?: number; // Day of the month for payment (1-31)
  terms?: string; // Additional terms and conditions
  
  status: ContractStatus;
  initialPropertyStateStatus?: InitialPropertyStateStatus; // Estado de la declaración inicial de la propiedad

  createdBy: string; // UID of the user who created the contract (usually landlord)
  createdAt: string; // ISO date string
  approvedAt?: string; // ISO date string
  rejectedAt?: string; // ISO date string
  terminatedAt?: string; // ISO date string, if contract ends prematurely
  
  existingContractUrl?: string;
  existingContractFileName?: string;

  // NEW: Field for contract observations and responses
  observations?: ContractObservation[];
}

export interface Incident {
  id: string;
  contractId: string;
  propertyId: string;
  propertyName?: string;
  tenantId: string;
  tenantName?: string;
  landlordId: string;
  landlordName?: string;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  createdBy: string;
  createdAt: string; // ISO date string
  initialAttachmentUrl?: string; // URL of the initial attachment
  initialAttachmentName?: string; // Name of the initial attachment
  responses: IncidentResponse[];
  respondedAt?: string; // ISO date string
  closedAt?: string; // ISO date string
  closedBy?: string; // UID of user who closed it
}

export type IncidentType = "pago" | "cuidado de la propiedad" | "ruidos molestos" | "reparaciones necesarias" | "incumplimiento de contrato" | "otros";
export type IncidentStatus = "pendiente" | "respondido" | "cerrado";

export interface IncidentResponse {
  responseText: string;
  respondedAt: string; // ISO date string
  respondedBy: string; // UID of user who responded
  responseAttachmentUrl?: string; // URL of the response attachment
  responseAttachmentName?: string; // Name of the response attachment
}

export interface Payment {
  id: string;
  contractId: string;
  propertyId: string;
  propertyName?: string; // Denormalized
  tenantId: string;
  tenantName?: string; // Denormalized
  landlordId: string;
  landlordName?: string; // Denormalized
  type: string; // Ej. "arriendo", "gastos comunes", "reparación"
  amount: number;
  paymentDate: string; // ISO date string or YYYY-MM-DD string
  notes?: string; // Any additional notes from the tenant
  status: "pendiente" | "aceptado";
  declaredBy: string; // UID of the user who declared the payment
  declaredAt: string; // ISO date string
  acceptedAt?: string; // ISO date string, if accepted by landlord
  attachmentUrl?: string; // URL del comprobante de pago
  isOverdue?: boolean; // NEW: Indicates if payment was declared past due date
}

export interface Evaluation {
  id: string;
  tenantId: string;
  contractId: string;
  landlordId: string;
  createdAt: string;
  period: string; // E.g., "Q1 2023", "Mayo 2023"
  criteria: {
    paymentPunctuality: number; // 1-5
    propertyCare: number; // 1-5
    communication: number; // 1-5
    generalBehavior: number; // 1-5
  };
  comments?: string;
}
