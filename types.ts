
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface Client {
  id: string;
  nitOrCc: string;
  name: string;
  city: string;
  phone: string;
  address: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD format for easier date input handling
  clientId: string;
  client?: Client; // Populated for display
  lineItems: LineItem[];
  notes?: string; // For things like bank account details
  currency?: InvoiceCurrency; // Currency of the line item prices (default COP)
  exchangeRate?: number | null; // TRM (COP per 1 USD) fixed when the invoice is generated
  totalAmount?: number; // Always in COP (computed by the backend)
}

export type InvoiceCurrency = 'COP' | 'USD';

export interface TrmInfo {
  value: number;
  date: string;
  validFrom: string;
  validTo: string;
  source: string;
}

export interface SenderDetails {
  name: string;
  nit: string;
  type: string; // e.g., "Persona Natural"
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  bankAccountInfo: string;
  signatureName: string;
  signatureCC: string;
  signatureImageUrl?: string; // For uploaded signature image
}

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method?: string;
  notes?: string;
  proofUrl?: string; // URL to the proof image
  createdAt?: string; // ISO 8601 date string from DB
  // Add any other fields that come from your payments table
}
