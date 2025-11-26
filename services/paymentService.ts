
import { Payment } from '../types';

// Base URL for your Node.js API
const API_BASE_URL = 'https://api.facturador.lidutech.net/api'; 

interface PaymentInputData {
  clientId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method?: string;
  notes?: string;
  proofUrl?: string | null; // URL of the proof image (if any)
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorData = { message: `Error ${response.status}: ${response.statusText}`, detail: '' };
    try {
      const jsonError = await response.json();
      errorData.message = jsonError.message || errorData.message;
      errorData.detail = jsonError.detail || ''; // Assuming Node.js backend might also send 'detail'
    } catch (e) {
      // Could not parse JSON, or response was not JSON.
      console.error("Failed to parse error response as JSON:", e);
    }
    
    if (errorData.detail) {
      console.error("Server error detail:", errorData.detail);
    }
    throw new Error(errorData.message);
  }
  // Handle cases where the response might be empty but OK (e.g., 204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const getPaymentsByClient = async (clientId: string): Promise<Payment[]> => {
  const response = await fetch(`${API_BASE_URL}/payments/client/${encodeURIComponent(clientId)}`);
  return handleResponse<Payment[]>(response);
};

export const createPayment = async (paymentData: PaymentInputData): Promise<Payment> => {
  const response = await fetch(`${API_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData),
  });
  // Expecting the created payment object back, matching the Payment interface
  return handleResponse<Payment>(response); 
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(paymentId)}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
};

// Add other payment-related API functions here if needed (e.g., updatePayment)
