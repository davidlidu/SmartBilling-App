import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { Payment, Client } from '../types';
import { getPaymentsByClient, createPayment, deletePayment } from '../services/paymentService';
import LoadingSpinner from './LoadingSpinner';
import { formatCurrency, formatDateForDisplay, formatDateForInput } from '../utils/formatting';
import { Trash2, PlusCircle, DollarSign, AlertCircle } from 'lucide-react';

interface PaymentManagerProps {
  client: Client;
  onClose: () => void;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({ client }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: formatDateForInput(new Date()),
    method: 'Transferencia',
    notes: ''
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPaymentsByClient(client.id);
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pagos.');
    } finally {
      setIsLoading(false);
    }
  }, [client.id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPayment.amount || Number(newPayment.amount) <= 0) {
        setError('Por favor ingrese un monto válido.');
        return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const paymentData = {
        clientId: client.id,
        amount: parseFloat(newPayment.amount),
        date: newPayment.date,
        method: newPayment.method,
        notes: newPayment.notes,
      };
      await createPayment(paymentData);
      setNewPayment({ // Reset form
        amount: '',
        date: formatDateForInput(new Date()),
        method: 'Transferencia',
        notes: ''
      });
      setSuccessMsg('Pago registrado correctamente.');
      fetchPayments(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Error al registrar el pago.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };
  
  const handleDelete = async (paymentId: string) => {
    if (window.confirm('¿Está seguro que desea eliminar este pago?')) {
        try {
            await deletePayment(paymentId);
            fetchPayments(); 
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el pago.');
        }
    }
  };

  // Cálculo del total asegurando que amount sea número
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20}/>
            <p className="text-red-700">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">{successMsg}</p>
        </div>
      )}
      
      {/* Formulario de Nuevo Pago */}
      <form onSubmit={handleSubmit} className="p-5 bg-blue-50 rounded-lg border border-blue-100 shadow-sm space-y-4">
        <h4 className="text-lg font-bold text-gray-800 flex items-center">
            <PlusCircle size={20} className="mr-2 text-primary"/> 
            Registrar Nuevo Pago
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-1">Monto ($)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input 
                    type="number" 
                    name="amount" 
                    id="amount" 
                    value={newPayment.amount} 
                    onChange={handleInputChange} 
                    required 
                    min="1" 
                    step="any" 
                    placeholder="0.00"
                    className="w-full pl-7 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
                />
            </div>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
            <input 
                type="date" 
                name="date" 
                id="date" 
                value={newPayment.date} 
                onChange={handleInputChange} 
                required 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" 
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="method" className="block text-sm font-semibold text-gray-700 mb-1">Método de Pago</label>
            <select name="method" id="method" value={newPayment.method} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-primary focus:border-primary">
                <option>Transferencia Bancaria</option>
                <option>Efectivo</option>
                <option>PSE</option>
                <option>Tarjeta de Crédito</option>
                <option>Cheque</option>
                <option>Otro</option>
            </select>
          </div>
          <div className="md:col-span-2">
             <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">Notas (Opcional)</label>
             <textarea name="notes" id="notes" value={newPayment.notes} onChange={handleInputChange} rows={2} className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="Referencia, concepto, etc." />
          </div>
        </div>
        <div className="text-right pt-2">
            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50 inline-flex justify-center items-center">
                {isSubmitting ? <LoadingSpinner size={4}/> : <DollarSign size={18} className="mr-2"/>}
                {isSubmitting ? 'Guardando...' : 'Guardar Pago'}
            </button>
        </div>
      </form>

      {/* Historial de Pagos */}
      <div>
        <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-bold text-gray-800">Historial de Pagos</h4>
            <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Total: {formatCurrency(totalPaid)}
            </span>
        </div>
        
        {isLoading ? (
          <div className="py-8"><LoadingSpinner /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No hay pagos registrados para este cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-700">Fecha</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Monto</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Método</th>
                  <th className="p-3 text-left font-semibold text-gray-700">Notas</th>
                  <th className="p-3 text-center font-semibold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap text-gray-600">{formatDateForDisplay(p.date)}</td>
                    
                    {/* CORRECCIÓN PRINCIPAL AQUÍ: Usamos Number() */}
                    <td className="p-3 whitespace-nowrap font-bold text-green-600">
                        {formatCurrency(Number(p.amount))}
                    </td>
                    
                    <td className="p-3 whitespace-nowrap text-gray-600">{p.method}</td>
                    <td className="p-3 text-gray-600 max-w-xs truncate" title={p.notes}>{p.notes || '-'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Eliminar Pago">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentManager;