
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
  isOverdue?: boolean; // True if paymentDate's day > contract.paymentDay
}

export type IncidentType = "pago" | "cuidado de la propiedad" | "ruidos molestos" | "reparaciones necesarias" | "incumplimiento de contrato" | "otros";
export type IncidentStatus = "pendiente" | "respondido" | "cerrado";

export interface Incident {
  id: string; // Firestore document ID
  contractId: string;
  propertyId: string; 
  propertyName: string; 
  landlordId: string; 
  landlordName?: string;
  tenantId: string; 
  tenantName?: string;
  
  type: IncidentType;
  status: IncidentStatus;
  
  // Initial Report
  description: string; 
  initialAttachmentUrl?: string; 
  createdAt: string; 
  createdBy: string; 
  
  // Response
  responseText?: string; 
  responseAttachmentUrl?: string; 
  respondedAt?: string; 
  respondedBy?: string; 
  
  // Closure
  closedAt?: string;
  closedBy?: string; 
}

export interface EvaluationCriteria {
  paymentPunctuality: number; // 1-5
  propertyCare: number; // 1-5
  communication: number; // 1-5
  generalBehavior: number; // 1-5
}

export type EvaluationStatus = "pendiente de confirmacion" | "recibida";

export interface Evaluation {
  id: string; // Firestore document ID
  contractId: string;
  propertyId: string; // Denormalized from contract
  propertyName?: string; // Denormalized from contract
  landlordId: string; // UID of the Landlord who created the evaluation
  landlordName?: string; // Denormalized
  tenantId: string; // UID of the Tenant being evaluated
  tenantName?: string; // Denormalized
  criteria: EvaluationCriteria;
  evaluationDate: string; // ISO date string, when the evaluation was submitted by landlord
  status: EvaluationStatus;
  tenantComment?: string; // Optional comment from the tenant upon confirmation
  tenantConfirmedAt?: string; // ISO date string, when the tenant confirmed receipt
  overallRating?: number; // Optional: can be calculated average
}

// For Tenant Certificate
export interface TenantRentalHistory {
  contractId: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
  landlordName: string;
}

export interface TenantEvaluationsSummary {
  averagePunctuality: number | null;
  averagePropertyCare: number | null;
  averageCommunication: number | null;
  averageGeneralBehavior: number | null;
  overallAverage: number | null;
  evaluations: Evaluation[]; // To list individual comments if needed
}

export interface TenantPaymentsSummary {
  totalPaymentsDeclared: number;
  totalPaymentsAccepted: number;
  totalAmountAccepted: number;
  compliancePercentage: number | null;
  totalOverduePayments: number;
  overduePaymentsPercentage: number | null;
}

export interface TenantIncidentsSummary {
  totalIncidentsInvolved: number; // Incidents where tenant is involved (created by or for them on their contracts)
  incidentsReportedByTenant: number;
  incidentsReceivedByTenant: number;
  incidentsResolved: number; // (status 'cerrado')
}

export interface TenantCertificateData {
  tenantProfile: UserProfile;
  rentalHistory: TenantRentalHistory[];
  evaluationsSummary: TenantEvaluationsSummary;
  paymentsSummary: TenantPaymentsSummary;
  incidentsSummary: TenantIncidentsSummary;
  globalScore: number | null; // e.g., 1-10 or 1-5 stars
  generationDate: string;
  certificateId: string; // Unique ID for this generated certificate instance
}
