
import { Invoice } from '../types';

const API_BASE_URL = '/api'; // PRODUCTION: Adjust to your deployed backend URL. e.g., https://yourdomain.com/api or '/api' if proxied.

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) { // Handle No Content for delete
    return undefined as T; 
  }
  return response.json() as Promise<T>;
};


export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await fetch(`${API_BASE_URL}/invoices`);
  const invoices = await handleResponse<Invoice[]>(response);
  // The backend now calculates totalAmount and can join clientName
  return invoices.map(inv => ({
    ...inv,
    lineItems: inv.lineItems ? inv.lineItems.map(item => ({
        ...item,
        quantity: parseFloat(String(item.quantity)) || 0,
        unitPrice: parseFloat(String(item.unitPrice)) || 0,
    })) : [], 
  }));
};

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`);
  if (response.status === 404) return undefined;
  const invoice = await handleResponse<Invoice>(response);

  if (invoice && invoice.lineItems) {
    invoice.lineItems = invoice.lineItems.map(item => ({
      ...item,
      quantity: parseFloat(String(item.quantity)) || 0,
      unitPrice: parseFloat(String(item.unitPrice)) || 0,
    }));
  }
  // The invoice from backend might already contain client details.
  // If not, and client details are needed separately, they should be fetched additionally.
  // For now, we assume 'invoice.client' is populated by the backend if available.
  return invoice;
};

export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'client'>): Promise<Invoice> => {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  return handleResponse<Invoice>(response);
};

export const updateInvoice = async (id: string, invoiceData: Partial<Omit<Invoice, 'id' | 'client'>>): Promise<Invoice | null> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  if (response.status === 404) return null;
  return handleResponse<Invoice>(response);
};

export const deleteInvoice = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: 'DELETE',
  });
   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.status === 204;
};

export const getNextInvoiceNumber = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/invoices/next-number`);
  const data = await handleResponse<{ nextInvoiceNumber: string }>(response);
  return data.nextInvoiceNumber;
};
