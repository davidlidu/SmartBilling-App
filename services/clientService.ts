import { Client } from '../types';

const API_BASE_URL = '/api'; // PRODUCTION: Adjust to your deployed backend URL. e.g., https://yourdomain.com/api or '/api' if proxied.

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
};

export const getClients = async (): Promise<Client[]> => {
  const response = await fetch(`${API_BASE_URL}/clients`);
  return handleResponse<Client[]>(response);
};

export const getClientById = async (id: string): Promise<Client | undefined> => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`);
   if (response.status === 404) return undefined;
  return handleResponse<Client>(response);
};

export const createClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  return handleResponse<Client>(response);
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client | null> => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clientData),
  });
  if (response.status === 404) return null;
  return handleResponse<Client>(response);
};

export const deleteClient = async (id: string): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    if (response.status === 400) { // Specific error for client with invoices
        const errorData = await response.json().catch(() => ({ message: 'Error al eliminar cliente.' }));
        throw new Error(errorData.message);
    }
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido del servidor' }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.status === 204; // Successfully deleted
};