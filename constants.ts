import { SenderDetails } from './types';

export const APP_NAME = "Generador de Facturas Pro";

// DEFAULT_SENDER_DETAILS serves as a fallback structure if the backend profile is not yet populated
// or if the backend connection fails. The primary source of truth is the backend.
export const DEFAULT_SENDER_DETAILS: SenderDetails = {
  name: "Tu Nombre/Empresa Aquí",
  nit: "Tu NIT/CC Aquí",
  type: "Persona Natural/Jurídica",
  logoUrl: undefined, // "https://via.placeholder.com/150x50.png?text=LOGO+EMPRESA",
  address: "Tu Dirección, Ciudad",
  phone: "Tu Teléfono",
  email: "tuemail@example.com",
  bankAccountInfo: "Información de cuenta bancaria (ej: Cuenta de ahorros Bancolombia XXX-XXXXXX-X)", // This will be populated from backend.
  signatureName: "Nombre del Firmante",
  signatureCC: "CC. del Firmante",
  signatureImageUrl: undefined,
};

export const DEFAULT_UNIT = "HORAS"; // Default unit for line items (e.g., "Horas", "Días", "Unidad")
