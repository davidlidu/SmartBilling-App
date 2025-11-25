import { Client } from '../types';

const API_BASE_URL = '/api'; 

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }
    return data as T;
  } else {
    const text = await response.text();
    console.error("Respuesta del servidor no es JSON:", text.substring(0, 200) + "...");
    throw new Error(`Error de Servidor (Status ${response.status}). Verifica la conexión a la base de datos.`);
  }
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
     await handleResponse(response); // Will throw error
     return false;
  }
  return response.status === 204; 
};
