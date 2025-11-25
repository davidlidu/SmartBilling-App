
import { Invoice } from '../types';

const API_BASE_URL = '/api'; // PRODUCTION: Adjust to your deployed backend URL. e.g., https://yourdomain.com/api or '/api' if proxied.

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    // Handle specific No Content case
    if (response.status === 204) return undefined as unknown as T;
    return data as T;
  } else {
    // If response is not JSON (likely HTML error page from Nginx/Node crash)
    const text = await response.text();
    console.error("Respuesta del servidor no es JSON:", text.substring(0, 200) + "..."); // Log first 200 chars
    throw new Error(`Error de Servidor (Status ${response.status}). Verifica la conexión a la base de datos en los logs del servidor.`);
  }
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
  // handleResponse handles the error check
  await handleResponse<void>(response); 
  return true;
};

export const getNextInvoiceNumber = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/invoices/next-number`);
  const data = await handleResponse<{ nextInvoiceNumber: string }>(response);
  return data.nextInvoiceNumber;
};
